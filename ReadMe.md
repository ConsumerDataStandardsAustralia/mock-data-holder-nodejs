
# How to use

Clone the repo and run `docker-compose up` from the root directory.

This will create a NodeJS data server `dsb-test-data-server` interrogating a MongoDB which is initialised with generated data.

The `dsb-data-loader` program will run once when the containers are generated, and populated a MongoDB
with the data from `load-test-data/input/VERSON/HOLDER_ID` folder.
The data in this the folder was generated withe DSB [testdata-cli](https://github.com/ConsumerDataStandardsAustralia/testdata-cli).

The resulting database (DSB), will have a `plans` collection, and a `customers` collection.

The holder data generated has multiple customers with a complete set of energy data.
The `load-test-data/output` contains the necessary ids for plans, customers, accounts, and service points.

```
├── load-test-data
│   ├── input
│   │   ├── [VERSION]
│   │   |   ├── [HOLDER ID]
│   │   |   |   ├── [customers]
│   │   |   |   ├── [plans]
│   │   |   |   ├── [postman]
│   ├── output
│   │   ├── [VERSION]
│   │   |   ├── [HOLDER ID]
│   │   |   |   ├── [USER ID]
│   │   |   |   |   ├── [accounts.json]
│   │   |   |   |   ├── [service-points.json]
│   |   |   |   ├── [plan-ids.json]
```

The running test data server can then be interrogated using the `CDR_Energy_Sector_Conformance_tests` collection
from the [Postman collection](https://github.com/ConsumerDataStandardsAustralia/dsb-postman) repository.

The Postman environment file `Data Factory Work - <VERSION>.postman_environment.json` in this repo will set identifiers for 
accounts, service points, and plans for the customer `02bce083-7e64-46e0-b373-71b53189928c`.

The user id for a customer MUST be passed in the header for authenticated endpoints.
The returned datasets for authenticated endpoints will then be for that particular user.

Ensure that the following header exists:
`authorization: "Bearer 02bce083-7e64-46e0-b373-71b53189928c"`
