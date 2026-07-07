# Recreate a source index locally: copy its reusable settings (incl. the
# Hebrew ICU analyzer) and mappings before any documents are streamed in.

# Drop index-private settings that Elasticsearch rejects on creation.
function Get-ReusableSettings {
    param([Parameter(Mandatory)] $IndexSettings)

    $excluded = @('uuid', 'creation_date', 'version', 'provided_name', 'resize', 'routing')
    $clean = @{}
    foreach ($property in $IndexSettings.PSObject.Properties) {
        if ($excluded -notcontains $property.Name) {
            $clean[$property.Name] = $property.Value
        }
    }
    return $clean
}

# Delete the local index if it already exists (idempotent re-runs).
function Remove-TargetIndex {
    param(
        [Parameter(Mandatory)][string] $BaseUrl,
        [Parameter(Mandatory)][string] $IndexName
    )
    try {
        Invoke-Es -BaseUrl $BaseUrl -Path $IndexName -Method 'DELETE' | Out-Null
    } catch {
        # Not found — nothing to remove.
    }
}

function New-TargetIndex {
    param(
        [Parameter(Mandatory)][hashtable] $Config,
        [Parameter(Mandatory)][string] $IndexName
    )

    $source = Invoke-Es -BaseUrl $Config.SOURCE_ES_URL -Path $IndexName `
        -Username $Config.SOURCE_ES_USERNAME -Password $Config.SOURCE_ES_PASSWORD
    $definition = $source.$IndexName

    $settings = Get-ReusableSettings -IndexSettings $definition.settings.index
    $settings['number_of_replicas'] = '0'
    $body = @{ settings = @{ index = $settings }; mappings = $definition.mappings }

    Remove-TargetIndex -BaseUrl $Config.LOCAL_ES_URL -IndexName $IndexName
    Invoke-Es -BaseUrl $Config.LOCAL_ES_URL -Path $IndexName -Method 'PUT' -Body $body | Out-Null
    Write-Host "  created local index '$IndexName'"
}
