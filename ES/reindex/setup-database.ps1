# Bootstrap a local Elasticsearch replica of the BE-facing indices.
# Run from anywhere:  .\ES\reindex\setup-database.ps1
# Prerequisite: a running port-forward to the remote ES matching SOURCE_ES_URL in .env
#   e.g.  kubectl port-forward svc/<elasticsearch-service> 9201:9200
$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
. "$root/steps/invoke-es.ps1"
. "$root/steps/load-env.ps1"
. "$root/steps/wait-for-elastic.ps1"
. "$root/steps/get-source-indices.ps1"
. "$root/steps/create-target-index.ps1"
. "$root/steps/copy-index-data.ps1"

$envPath = Join-Path $root '.env'
if (-not (Test-Path $envPath)) {
    Copy-Item (Join-Path $root '.env.example') $envPath
    throw "Created $envPath from the template. Fill in the SOURCE_ES_* values, then re-run."
}

$required = @('SOURCE_ES_URL', 'SOURCE_ES_PASSWORD', 'LOCAL_ES_URL', 'INDEX_PATTERNS')
$config = Import-DotEnv -Path $envPath -RequiredKeys $required

Write-Host 'Building and starting local Elasticsearch...'
docker compose -f (Join-Path $root 'docker-compose.yml') up -d --build
if ($LASTEXITCODE -ne 0) { throw 'docker compose failed to start local Elasticsearch.' }

Wait-ForElastic -BaseUrl $config.LOCAL_ES_URL

$indices = Get-SourceIndices -BaseUrl $config.SOURCE_ES_URL -Patterns $config.INDEX_PATTERNS `
    -Username $config.SOURCE_ES_USERNAME -Password $config.SOURCE_ES_PASSWORD
if (-not $indices) { throw "No source indices match '$($config.INDEX_PATTERNS)' at $($config.SOURCE_ES_URL)." }
Write-Host "Found $($indices.Count) source index(es): $($indices -join ', ')"

foreach ($index in $indices) {
    Write-Host "Replicating '$index'..."
    New-TargetIndex -Config $config -IndexName $index
    Copy-IndexData -Config $config -IndexName $index
}

Invoke-Es -BaseUrl $config.LOCAL_ES_URL -Path '_refresh' -Method 'POST' | Out-Null
Write-Host ''
Write-Host 'Replication complete. Document counts (source -> local):'
foreach ($index in $indices) {
    $source = (Invoke-Es -BaseUrl $config.SOURCE_ES_URL -Path "$index/_count" `
        -Username $config.SOURCE_ES_USERNAME -Password $config.SOURCE_ES_PASSWORD).count
    $local = (Invoke-Es -BaseUrl $config.LOCAL_ES_URL -Path "$index/_count").count
    Write-Host "  $index : $source -> $local"
}
