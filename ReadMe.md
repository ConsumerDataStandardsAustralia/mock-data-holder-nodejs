
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

# Overview

This repository provides a convenient way to create a test data server. The system consist of a number of docker containers, some of which are maintained by the ACCC, others are maintained by the Data Standards Body.



## How to use

A number of setup and configuration steps need to be followed. This instructions are if you want to run this system in a containerised.

**Run `docker compose up`**

Wait until all containers have started and are *healthy*, then follow the *Additional Setup Steps* below where this applies

### Additional Setup Steps

1. Initialisation script (essential)

   The current setup bypasses the client registration, i.e. it the "accredited data recipient" is created via the backdoor using an SQL script.
   This step is essential for the functioning of the `mock-data-recpient` and the authorisation process.

   - connect to the the SQL instance running
   - run the script in `utils\sql\\AddClientScriptRelease.sql`

   This will create a registered client.

2. Edit Host file  (essential)
   
   A number of entries are required in the `host` file. This file typically sits in C:\Windows\System32\drivers\etc\hosts on Windows platforms, and /private/etc/hosts on MacOS (although this may be different).

   - 127.0.0.1 mock-data-holder
   - 127.0.0.1 mock-data-recipient
   - 127.0.0.1 mock-data-holder-energy
   - 127.0.0.1 mock-register
   - 127.0.0.1 mtls-gateway
   - 127.0.0.1 tls-gateway

3. App config settings (depends)
   
   The `config` folder contains a number of appsettings files, which are utilised during the docker build process.
   Normally you would leave these files as they are unless you start changing urls, ids, etc.

   At time there may be a need to edit some values. For instance, the default validity period for an access token can be set in the `auth-server\appsettings.Release.json`

   If any setting is changed, the containers need to be rebuild.
   Ie, `docker compose down`, followed by `docker compose up --build`
   Step 1 may need to be repeated.

4. Certificates (depends)
   
   The certificates being used by the containers have been created for this setup. In particular, the naming of hosts is important when certificates are created. So, unless you change stuff in that space or you want to use your own CA, there should be nothing that requires change her.

   If any setting is changed, the containers need to be rebuild.
   Ie, `docker compose down`, followed by `docker compose up --build`
   Step 1 may need to be repeated.

## Testing the server

If you want to use Postman, the `mtls-gateway\client.pfx` certificate must be associated with `https://mtls-gateway:8082` and the `mtls-gateway\ca.pem` must be specified as the Certificate Authority. Please refer to the Post certificate management documentation for more information

The running test data server can then be interrogated using the `CDR_Energy_Sector_Conformance_tests` collection
from the [Postman collection](https://github.com/ConsumerDataStandardsAustralia/dsb-postman) repository.

The Postman environment file `DSB Test Data Server - Authenticated.postman_environment.json` in the `test-data-server\postman` folder within *this* repo will set identifiers for accounts, service points, and plans for a customer for the datasets found in the `input\1.24.0` in this repo.

