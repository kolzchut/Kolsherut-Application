# Return the concrete index names on the source that match the given
# comma-separated patterns (e.g. "srm__cards_*,srm__autocomplete_*").
# Uses the get-index API (GET /<patterns>) so there is no query string to
# mangle; wildcard patterns that match nothing return an empty object, not 404.
function Get-SourceIndices {
    param(
        [Parameter(Mandatory)][string] $BaseUrl,
        [Parameter(Mandatory)][string] $Patterns,
        [string] $Username,
        [string] $Password
    )

    $result = Invoke-Es -BaseUrl $BaseUrl -Path $Patterns -Username $Username -Password $Password

    return @($result.PSObject.Properties.Name | Sort-Object)
}
