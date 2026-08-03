[CmdletBinding()]
param(
    [ValidateSet('status', 'start', 'restart', 'stop')]
    [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'
$webTaskName = 'PiAgentIntegratedWeb'
$tunnelTaskName = 'PiAgentIntegratedTunnel'
$localUrl = 'http://127.0.0.1:30141/'
# 公网地址从环境变量读取（.env 中设置 PI_AGENT_PUBLIC_URL），不在代码里写死个人域名
$publicUrl = $env:PI_AGENT_PUBLIC_URL
if ([string]::IsNullOrWhiteSpace($publicUrl)) {
    $publicUrl = '(未配置 PI_AGENT_PUBLIC_URL)'
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
        Start-ScheduledTask -TaskName $tunnelTaskName
        Start-ScheduledTask -TaskName $webTaskName
        Start-Sleep -Seconds 3
        Get-PublicAccessStatus
    }
    'restart' {
        Stop-ScheduledTask -TaskName $webTaskName -ErrorAction SilentlyContinue
        Stop-ScheduledTask -TaskName $tunnelTaskName -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Start-ScheduledTask -TaskName $tunnelTaskName
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
