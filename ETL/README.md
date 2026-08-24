
etl 




## data fetchers ##
all data fetching services use the same script
```

```
all you need to do is rceate a relevant spec file for each and add the name of the spec file to the script source
example:
```
#!/bin/sh

cd /opt/cronicle/plugins/srm-etl

export PYTHONPATH=$PWD

python3 -m operators.shil
```
[list of Data soruces and spec files](./data.md)

[spec folder](./data/plugins/srm-etl/specs)
