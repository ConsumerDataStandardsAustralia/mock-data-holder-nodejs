
# How to use

Clone the repo and run `docker-compose up` from the root directory.

This will create a NodeJS data server `dsb-test-data-server` interrogating a MongoDB which is initialised with generated data.

The `dsb-data-loader` will run when the containers are generated and populated with the data in `input/HOLDER_ID` folder.
The data in the folder was generated withe DSB testdata-cli.