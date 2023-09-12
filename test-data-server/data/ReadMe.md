
# Endpoints

The endpoints.json is used by the  dsb-test-data server on startup to initialise the
@cds-au/holder-sdk middleware.

It contains the list, version of the API enpoints implemented.
Among other things, the @cds-au/holder-sdk middleware will use the contents of this file to determine the validity of headers (eg x-v), and contruct appropriated error responses if required.