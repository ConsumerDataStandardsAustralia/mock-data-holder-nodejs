
# DSB Test Data

This repository consist of a 

- data loader (load-test-data), which will load data from the `load-test-data\input` into a MongoDB, and 
- a data server (test-data-server), which exposes the API endpoints as documented in the DSB published technical standards.

The two programs have been containerised and can easily be run with `docker compose`.

*Note: Currently only the Energy API endpoints have been implemented*

## Disclaimer

The artefacts in this repo are offered without warranty or liability, in accordance with the [MIT licence.](https://github.com/ConsumerDataStandardsAustralia/java-artefacts/blob/master/LICENSE)

[The Data Standards Body](https://www.csiro.au/en/News/News-releases/2018/Data61-appointed-to-Data-Standards-Body-role)
(DSB) develops these artefacts in the course of its work, in order to perform quality assurance on the Australian Consumer Data Right Standards (Data Standards).

The DSB makes this repo, and its artefacts, public [on a non-commercial basis](https://github.com/ConsumerDataStandardsAustralia/java-artefacts/blob/master/LICENSE)
in the interest of supporting the participants in the CDR eco-system.

The resources of the DSB are primarily directed towards assisting the [Data Standards Chair](https://consumerdatastandards.gov.au/about/)
for [developing the Data Standards](https://github.com/ConsumerDataStandardsAustralia/standards).

Consequently, the development work provided on the artefacts in this repo is on a best-effort basis,
and the DSB acknowledges the use of these tools alone is not sufficient for, nor should they be relied upon
with respect to [accreditation](https://www.accc.gov.au/focus-areas/consumer-data-right-cdr-0/cdr-draft-accreditation-guidelines),

# How to use

There is two approaches on how to use this repo

- a simple mode, which is suitable for smaller data sets. In this implementation the entire database is a single document which must be of the structure as defined in [testdata-cli](https://github.com/ConsumerDataStandardsAustralia/testdata-cli)
The maximum document size is determined by the MongoDB server (16 Mb)
- a structured mode, which is suitable for larger datasets where the data is broken up into documents per customer. 
The [testdata-cli](https://github.com/ConsumerDataStandardsAustralia/testdata-cli) can produce the files required for this purpose. (see the setting `individualFileOutDir` in the ReadMe file for the [testdata-cli](https://github.com/ConsumerDataStandardsAustralia/testdata-cli))

## Simple Mode - Small Datasets
Use the NodeJS data server and serve a data set which must be of the structure as defined in [testdata-cli](https://github.com/ConsumerDataStandardsAustralia/testdata-cli).

For this approach the data generate by the test-data is a single document database.
This is suitable for smalled data sets.

- Set the value for DATA_IS_SINGLE_DOCUMENT in the `.env.docker` file to `true`.
- Put a data file in the `input\VERSION\all-data` folder. The structure of this file must be as per [testdata-cli](https://github.com/ConsumerDataStandardsAustralia/testdata-cli) schema
- Set the value for SINGLE_COLLECTION_NAME in the `.env.docker` file to the name of the data file (less extension).
- Leave all other values in the `.env.docker`.
- Run `docker-compose up` from the root directory.

This will create a NodeJS data server `dsb-test-data-server` interrogating a MongoDB which is initialised with generated data in the collection as per SINGLE_COLLECTION_NAME.

## Structured Mode - Larger datasets

For this approach the data is broken up into documents per customer and plans. The testdata-cli can create the segmented files required for this approach. (see the setting `individualFileOutDir` in the ReadMe file for the [testdata-cli](https://github.com/ConsumerDataStandardsAustralia/testdata-cli))

- Set the value for DATA_IS_SINGLE_DOCUMENT in the `.env.docker` file to `false`.
- Put a data files in the `input\VERSION\` folder. 
- Leave all other values in the `.env.docker`.
- Run `docker-compose up` from the root directory.

The `dsb-data-loader` program will run once when the containers are generated, and populated a MongoDB
with the data from `load-test-data/input/VERSION/HOLDER_ID` folder.
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

## Testing the server

The running test data server can then be interrogated using the `CDR_Energy_Sector_Conformance_tests` collection
from the [Postman collection](https://github.com/ConsumerDataStandardsAustralia/dsb-postman) repository.

The Postman environment file `Data Factory Work - <VERSION>.postman_environment.json` in the `test-data-server\postman` folder within *this* repo will set identifiers for accounts, service points, and plans for a customer for the datasets found in the `input\1.24.0` in this repo.

## Emulation of Identity Provider

The  *customer id*  MUST be passed in the header for authenticated endpoints.
The returned datasets for authenticated endpoints will then be for that particular user.

Ensure that the following header exists:

`authorization: "Bearer CUSTOMER_ID"`

Eg, `authorization: "Bearer 02bce083-7e64-46e0-b373-71b53189928c"`
