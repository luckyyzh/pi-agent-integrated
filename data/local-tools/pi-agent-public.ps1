[CmdletBinding()]
param(
    [ValidateSet('status', 'start', 'restart', 'stop')]
    [string]$Action = 'status',
    [switch]$NoTunnel
)

$ErrorActionPreference = 'Stop'
$webTaskName = 'PiAgentIntegratedWeb'
$tunnelTaskName = 'PiAgentIntegratedTunnel'
$localUrl = 'http://127.0.0.1:30141/'
# local-tools 位于 data/ 下，上两级才是项目根
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# 加载项目 .env（独立运行的脚本不会自动加载，需手动解析）
$envFile = Join-Path $projectRoot '.env'
if (Test-Path $envFile) {
    Get-Content $envFile -Encoding UTF8 | ForEach-Object {
        if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
            $envName = $matches[1]
            $envValue = $matches[2].Trim()
            if (-not [string]::IsNullOrWhiteSpace($envValue) -and -not [Environment]::GetEnvironmentVariable($envName, 'Process')) {
                Set-Item -Path "Env:$envName" -Value $envValue
            }
        }
    }
}

# 隧道命令从环境变量读取（.env 中设置 PI_AGENT_TUNNEL_COMMAND），例如:
#   C:\WINDOWS\System32\OpenSSH\ssh.exe -n -N -T -o BatchMode=yes -R 127.0.0.1:8090:127.0.0.1:30141 aliyun
$tunnelCommand = $env:PI_AGENT_TUNNEL_COMMAND
# 公网地址从环境变量读取（.env 中设置 PI_AGENT_PUBLIC_URL），不在代码里写死个人域名
$publicUrl = $env:PI_AGENT_PUBLIC_URL
if ([string]::IsNullOrWhiteSpace($publicUrl)) {
    $publicUrl = '(未配置 PI_AGENT_PUBLIC_URL)'
}

function Ensure-Tasks {
    # Web supervisor 任务：必需，自动注册（相对路径，新机器可直接用）
    if (-not (Get-ScheduledTask -TaskName $webTaskName -ErrorAction SilentlyContinue)) {
        Write-Host "  注册计划任务 $webTaskName ..."
        $supervisorPath = Join-Path $PSScriptRoot 'pi-agent-web-supervisor.ps1'
        # 单引号拼接避免转义歧义（`\" 不是 PowerShell 转义引号）
        $argument = '-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $supervisorPath + '"'
        $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argument -WorkingDirectory $projectRoot
        $trigger = New-ScheduledTaskTrigger -AtLogOn
        $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
            -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
            -ExecutionTimeLimit ([TimeSpan]::Zero)
        Register-ScheduledTask -TaskName $webTaskName -Action $action -Trigger $trigger `
            -Settings $settings -Description 'Pi Agent Integrated Web supervisor' -Force | Out-Null
    }

    # Tunnel 任务：可选，仅在配置了 PI_AGENT_TUNNEL_COMMAND 时注册；-NoTunnel 明确跳过
    if ($NoTunnel) {
        Write-Host "  - 已跳过隧道任务（-NoTunnel）"
        return
    }
    if (Get-ScheduledTask -TaskName $tunnelTaskName -ErrorAction SilentlyContinue) { return }
    if ([string]::IsNullOrWhiteSpace($tunnelCommand)) {
        Write-Host "  - 未配置 PI_AGENT_TUNNEL_COMMAND，跳过隧道任务"
        return
    }
    Write-Host "  注册计划任务 $tunnelTaskName ..."
    $parts = $tunnelCommand.Trim() -split '\s+', 2
    $action = New-ScheduledTaskAction -Execute $parts[0] -Argument $parts[1]
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
        -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit ([TimeSpan]::Zero)
    Register-ScheduledTask -TaskName $tunnelTaskName -Action $action -Trigger $trigger `
        -Settings $settings -Description 'Pi Agent Integrated public tunnel' -Force | Out-Null
}

function Get-PublicAccessStatus {
    $webTask = Get-ScheduledTask -TaskName $webTaskName -ErrorAction SilentlyContinue
    $tunnelTask = Get-ScheduledTask -TaskName $tunnelTaskName -ErrorAction SilentlyContinue
    $listener = Get-NetTCPConnection -State Listen -LocalPort 30141 -ErrorAction SilentlyContinue

    $httpStatus = 'unavailable'
    try {
        $response = Invoke-WebRequest -Uri $localUrl -Method Head -TimeoutSec 10
        $httpStatus = [string][int]$response.StatusCode
    }
    catch {
        if ($_.Exception.Response) {
            $httpStatus = [string][int]$_.Exception.Response.StatusCode
        }
    }

    [pscustomobject]@{
        WebTask = if ($webTask) { [string]$webTask.State } else { 'missing' }
        TunnelTask = if ($tunnelTask) { [string]$tunnelTask.State } else { 'missing' }
        Port30141 = if ($listener) { 'listening' } else { 'closed' }
        LocalHttp = $httpStatus
        PublicUrl = $publicUrl
    } | Format-List
}

switch ($Action) {
    'status' {
        Get-PublicAccessStatus
    }
    'start' {
        Ensure-Tasks
        if (-not $NoTunnel) { Start-ScheduledTask -TaskName $tunnelTaskName -ErrorAction SilentlyContinue }
        Start-ScheduledTask -TaskName $webTaskName
        Start-Sleep -Seconds 3
        Get-PublicAccessStatus
    }
    'restart' {
        Stop-ScheduledTask -TaskName $webTaskName -ErrorAction SilentlyContinue
        Stop-ScheduledTask -TaskName $tunnelTaskName -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        if (-not $NoTunnel) { Start-ScheduledTask -TaskName $tunnelTaskName -ErrorAction SilentlyContinue }
        Start-ScheduledTask -TaskName $webTaskName
        Start-Sleep -Seconds 3
        Get-PublicAccessStatus
    }
    'stop' {
        Stop-ScheduledTask -TaskName $webTaskName -ErrorAction SilentlyContinue
        Stop-ScheduledTask -TaskName $tunnelTaskName -ErrorAction SilentlyContinue
        Get-PublicAccessStatus
    }
}
