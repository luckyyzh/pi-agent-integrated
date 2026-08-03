[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$logsDirectory = Join-Path $projectRoot 'data\logs'
$standardOutputLog = Join-Path $logsDirectory 'pi-web-service.out.log'
$standardErrorLog = Join-Path $logsDirectory 'pi-web-service.err.log'
$supervisorLog = Join-Path $logsDirectory 'pi-web-supervisor.log'
$restartRequestPath = Join-Path $projectRoot 'data\agent\restart-request.json'
$webUrl = 'http://127.0.0.1:30141/'
$restartRequestVersion = 1

New-Item -ItemType Directory -Path $logsDirectory -Force | Out-Null
New-Item -ItemType Directory -Path (Split-Path -Parent $restartRequestPath) -Force | Out-Null
Set-Content -LiteralPath $supervisorLog -Value "$(Get-Date -Format o) supervisor started"

function Write-SupervisorLog {
    param([string]$Message)

    Add-Content -LiteralPath $supervisorLog -Value "$(Get-Date -Format o) $Message"
}

function Get-RestartRequest {
    if (-not (Test-Path -LiteralPath $restartRequestPath -PathType Leaf)) {
        return $null
    }

    try {
        # The extension writes the request with Node (UTF-8 without BOM);
        # Windows PowerShell 5.1 Get-Content defaults to ANSI and would corrupt
        # non-ASCII testInstructions, breaking ConvertFrom-Json silently.
        $request = Get-Content -LiteralPath $restartRequestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ([int]$request.version -ne $restartRequestVersion) {
            return $null
        }
        if ([string]::IsNullOrWhiteSpace([string]$request.requestId)) {
            return $null
        }
        if ([string]::IsNullOrWhiteSpace([string]$request.sessionId)) {
            return $null
        }
        if ([string]::IsNullOrWhiteSpace([string]$request.testInstructions)) {
            return $null
        }

        if ([string]$request.state -eq 'ready') {
            return $request
        }

        # session_shutdown normally changes requested -> ready. If that event
        # was interrupted, allow a stale request to proceed after a grace period.
        if ([string]$request.state -eq 'requested') {
            $createdAt = [DateTimeOffset]::MinValue
            if ([DateTimeOffset]::TryParse([string]$request.createdAt, [ref]$createdAt)) {
                $ageSeconds = ([DateTimeOffset]::UtcNow - $createdAt.ToUniversalTime()).TotalSeconds
                if ($ageSeconds -ge 15) {
                    return $request
                }
            }
        }
    }
    catch {
        # The extension writes the request atomically. A transient parse failure
        # means the file is still being replaced; retry on the next poll.
    }

    return $null
}

function Remove-RestartRequest {
    Remove-Item -LiteralPath $restartRequestPath -Force -ErrorAction SilentlyContinue
}

function Stop-ProcessTree {
    param([System.Diagnostics.Process]$Process)

    if (-not $Process -or $Process.HasExited) {
        return
    }

    Write-SupervisorLog "stopping Web process tree for restart request (PID $($Process.Id))"
    & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Null
}

function Test-WebReady {
    try {
        $response = Invoke-WebRequest -Uri $webUrl -Method Get -TimeoutSec 3 -UseBasicParsing
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
    }
    catch {
        return $false
    }
}

function Get-RequestField {
    param(
        [object]$Request,
        [string]$Name
    )

    $property = $Request.PSObject.Properties[$Name]
    if ($property) {
        return [string]$property.Value
    }

    if ($Request -is [System.Collections.IDictionary] -and $Request.Contains($Name)) {
        return [string]$Request[$Name]
    }

    return ''
}

function Resume-AgentSession {
    param([object]$Request)

    $requestId = Get-RequestField $Request 'requestId'
    $sessionId = Get-RequestField $Request 'sessionId'
    $testInstructions = Get-RequestField $Request 'testInstructions'
    $encodedSessionId = [Uri]::EscapeDataString($sessionId)
    $resumeMessage = @"
[Pi Web restart complete]

Pi Web was restarted by the external supervisor and the previous Agent session was restored. Request ID: $requestId
Continue the previous task without repeating completed edits.

Post-restart verification:
$testInstructions
"@
    $body = @{
        type = 'prompt'
        message = $resumeMessage.Trim()
    } | ConvertTo-Json -Compress
    $bodyBytes = [Text.Encoding]::UTF8.GetBytes($body)

    $response = Invoke-RestMethod `
        -Uri "http://127.0.0.1:30141/api/agent/$encodedSessionId" `
        -Method Post `
        -ContentType 'application/json; charset=utf-8' `
        -Body $bodyBytes `
        -TimeoutSec 30

    if (-not $response.success) {
        throw "Agent resume API returned an unsuccessful response"
    }

    Write-SupervisorLog "resumed Agent session $sessionId for request $requestId"
    Remove-RestartRequest
}

$pendingRequest = Get-RestartRequest

while ($true) {
    $process = $null
    try {
        $npmCommand = (Get-Command npm.cmd -ErrorAction Stop).Source
        Write-SupervisorLog 'starting npm run restart'

        $process = Start-Process `
            -FilePath $npmCommand `
            -ArgumentList @('run', 'restart') `
            -WorkingDirectory $projectRoot `
            -WindowStyle Hidden `
            -RedirectStandardOutput $standardOutputLog `
            -RedirectStandardError $standardErrorLog `
            -PassThru

        $startedAt = Get-Date
        $nextResumeAttempt = Get-Date

        while (-not $process.HasExited) {
            if ($pendingRequest -and (Get-Date) -ge $nextResumeAttempt) {
                # Give npm/Next a moment to finish binding the port before the
                # first resume attempt. Failed attempts remain pending and retry.
                if (((Get-Date) - $startedAt).TotalSeconds -ge 2 -and (Test-WebReady)) {
                    try {
                        Resume-AgentSession $pendingRequest
                        $pendingRequest = $null
                    }
                    catch {
                        Write-SupervisorLog "Agent resume failed: $($_.Exception.Message)"
                        $nextResumeAttempt = (Get-Date).AddSeconds(3)
                    }
                }
            }

            if (-not $pendingRequest) {
                $candidate = Get-RestartRequest
                if ($candidate) {
                    $pendingRequest = $candidate
                    Write-SupervisorLog "restart request $($candidate.requestId) detected"
                    Stop-ProcessTree $process
                    break
                }
            }

            $null = $process.WaitForExit(500)
        }

        if (-not $process.HasExited) {
            $null = $process.WaitForExit(10000)
        }

        if ($process.HasExited) {
            Write-SupervisorLog "web process exited with code $($process.ExitCode)"
        }
    }
    catch {
        Write-SupervisorLog "supervisor error: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds 5
}
