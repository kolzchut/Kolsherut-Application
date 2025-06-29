# kolSherut-WIP

### FE

### BE

The BE of this project is built with Typescript and Node.js, using the Express framework. It is designed to handle
requests from the frontend, process data, and interact with the database.

#### EnvironmentEnum Variables of BE:

| Variable                  | Description                                                        | Default               |
|---------------------------|--------------------------------------------------------------------|-----------------------|
| ORIGIN                    | the front end origin for cors (Need to change default)             | *                     |
| ENV                       | the environment you working on                                     | dev                   |
| PORT                      | the port for the back end                                          | 3000                  |
| ELASTIC_URL               | the elastic search URL (Need to change default)                    | http://localhost:9200 |
| ELASTIC_USERNAME          | the elastic search username (Need to change default)               | elastic               |
| ELASTIC_PASSWORD          | the elastic search password (Need to change default)               | your-password         |
| ELASTIC_RECONNECT_TIMEOUT | the time to wait before reconnecting to elastic search (seconds)   | 5                     |
| VERBOSE                   | Default to false, if true will log more information to the console | false                 |
| LOG_TO_FILE               | Default to false, if true will log to file                         | false                 |
| LOG_DURATION              | The duration content of each file. (minutes)                       | 10                    |
