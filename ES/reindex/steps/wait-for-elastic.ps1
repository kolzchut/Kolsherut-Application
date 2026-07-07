# Poll the local cluster health until it is reachable and yellow/green.
# Connection refusals while the container boots are expected, so they are
# swallowed here (readiness polling) rather than propagated.
function Wait-ForElastic {
    param(
        [Parameter(Mandatory)][string] $BaseUrl,
        [int] $TimeoutSeconds = 180,
        [int] $IntervalSeconds = 5
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $health = Invoke-Es -BaseUrl $BaseUrl -Path '_cluster/health' -TimeoutSeconds $IntervalSeconds
            if ($health.status -in @('yellow', 'green')) {
                Write-Host "Local Elasticsearch is up (status: $($health.status))."
                return
            }
        } catch {
            Write-Host 'Waiting for local Elasticsearch to accept connections...'
        }
        Start-Sleep -Seconds $IntervalSeconds
    }

    throw "Elasticsearch did not become healthy within $TimeoutSeconds seconds."
}
