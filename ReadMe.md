
# DSB Test Data

This repository contains the source for

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

# Setup steps

1. App config settings in 
2. Initialisation script
3. Edit Host file

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

# Setup steps

1. App config settings in 
2. Initialisation script
3. Edit Host file