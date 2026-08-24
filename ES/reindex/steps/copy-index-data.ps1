# Stream every document from a source index into the local one using the
# scroll API (read) + bulk API (write), preserving document _id.

# Build one NDJSON bulk request from a page of hits and index it locally.
function Write-BulkBatch {
    param(
        [Parameter(Mandatory)][hashtable] $Config,
        [Parameter(Mandatory)][string] $IndexName,
        [Parameter(Mandatory)] $Hits
    )

    $builder = [System.Text.StringBuilder]::new()
    foreach ($hit in $Hits) {
        $action = @{ index = @{ _index = $IndexName; _id = $hit._id } } | ConvertTo-Json -Compress -Depth 5
        $document = $hit._source | ConvertTo-Json -Compress -Depth 50
        [void] $builder.Append($action).Append("`n")
        [void] $builder.Append($document).Append("`n")
    }

    $result = Invoke-Es -BaseUrl $Config.LOCAL_ES_URL -Path '_bulk' -Method 'POST' `
        -Body $builder.ToString() -ContentType 'application/x-ndjson'
    if ($result.errors) { Write-Warning "Bulk into '$IndexName' reported item errors." }
}

# Release the scroll context on the source once the copy is done.
function Clear-Scroll {
    param(
        [Parameter(Mandatory)][hashtable] $Config,
        [string] $ScrollId
    )
    if (-not $ScrollId) { return }
    Invoke-Es -BaseUrl $Config.SOURCE_ES_URL -Path '_search/scroll' -Method 'DELETE' `
        -Body @{ scroll_id = $ScrollId } `
        -Username $Config.SOURCE_ES_USERNAME -Password $Config.SOURCE_ES_PASSWORD | Out-Null
}

function Copy-IndexData {
    param(
        [Parameter(Mandatory)][hashtable] $Config,
        [Parameter(Mandatory)][string] $IndexName
    )

    $scroll = $Config.SCROLL_TIMEOUT
    $response = Invoke-Es -BaseUrl $Config.SOURCE_ES_URL -Path "$IndexName/_search?scroll=$scroll" `
        -Method 'POST' -Body @{ size = [int] $Config.SCROLL_BATCH_SIZE; query = @{ match_all = @{} } } `
        -Username $Config.SOURCE_ES_USERNAME -Password $Config.SOURCE_ES_PASSWORD

    $total = 0
    while ($response.hits.hits.Count -gt 0) {
        Write-BulkBatch -Config $Config -IndexName $IndexName -Hits $response.hits.hits
        $total += $response.hits.hits.Count
        Write-Host "  $IndexName : copied $total documents"
        $response = Invoke-Es -BaseUrl $Config.SOURCE_ES_URL -Path '_search/scroll' -Method 'POST' `
            -Body @{ scroll = $scroll; scroll_id = $response._scroll_id } `
            -Username $Config.SOURCE_ES_USERNAME -Password $Config.SOURCE_ES_PASSWORD
    }

    Clear-Scroll -Config $Config -ScrollId $response._scroll_id
}
