USE [cdr-auth-server]

DECLARE @ClientId NVARCHAR(450) = N'77831c42-7e8b-457a-93b2-d714bb3b2bc6'
DECLARE @OrganisationId NVARCHAR(450) = N'5242a9d7-4c5d-43c7-a78a-844e352c7593'
DECLARE @LegalEntityId NVARCHAR(450) = N'8ecd3c03-1638-4936-97c3-76d2f3ac9d0d'
DECLARE @LegalEntityName NVARCHAR(450) = N'Data Standards Body'
DECLARE @NodeBrandId NVARCHAR(450) = N'67e23b31-f5a4-4f5b-b8ec-95869292026c'
DECLARE @JavaBrandId NVARCHAR(450) = N'c90f6f6f-6b38-40bb-8de5-1dfcddf1188f'
DECLARE @NodeBrandName NVARCHAR(450) = N'DSB Node Provider'
DECLARE @JavaBrandName NVARCHAR(450) = N'DSB Java Provider'
DECLARE @NodeSoftwareId NVARCHAR(450) = N'36094666-7e37-4717-8ab0-0c3d3485f56e'
DECLARE @NodeSoftwareName NVARCHAR(450) = N'DSB Node Software'
DECLARE @JavaSoftwareId NVARCHAR(450) = N'39ea251a-7612-4fbb-8c95-57a07232c608'
DECLARE @JavaSoftwareName NVARCHAR(450) = N'DSB Java Software'
DECLARE @DataRecipientBaseUri NVARCHAR(450) = N'https://mock-data-recipient:9001'
DECLARE @NodeDataHolderBaseUri NVARCHAR(450) = N'https://node-data-holder:3005'
DECLARE @JavaDataHolderBaseUri NVARCHAR(450) = N'https://java-data-holder:3006'
DECLARE @InfoSecBaseUri NVARCHAR(450) = N'https://cdr-auth-server:8001'
-- Set this to wherever the data recipient client is running
DECLARE @LogoUri NVARCHAR(450) = @DataRecipientBaseUri + '/logo.png'



-- Remove existing client data for FAPI clients.
DELETE FROM dbo.[Clients] WHERE ClientId IN (@ClientId)
DELETE FROM dbo.[ClientClaims] WHERE ClientId IN (@ClientId)



-- Insert client data for FAPI testing.
INSERT [dbo].[Clients]
      ([ClientId], [ClientIdIssuedAt], [ClientName], [ClientDescription])
VALUES
      (@ClientId, 1667260800, @NodeSoftwareName, @NodeSoftwareName)



INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, 'grant_types', 'client_credentials;refresh_token;authorization_code');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, 'redirect_uris', @DataRecipientBaseUri + '/consent/callback');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, 'scope', 'openid profile common:customer.basic:read common:customer.detail:read cdr:registration energy:electricity.servicepoints.basic:read energy:electricity.servicepoints.detail:read energy:electricity.usage:read energy:accounts.basic:read energy:accounts.detail:read energy:accounts.paymentschedule:read energy:accounts.concessions:read energy:billing:read energy:electricity.der:read bank:accounts.basic:read bank:accounts.detail:read bank:transactions:read bank:regular_payments:read bank:payees:read');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, 'application_type', N'web');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, 'software_id', @NodeSoftwareId);
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, 'software_statement', N'eyJhbGciOiJQUzI1NiIsImtpZCI6IjIwM0E');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'logo_uri', @LogoUri);
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'policy_uri', N'https://mocksoftware/mybudgetapp/policy');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'tos_uri', N'https://mocksoftware/mybudgetapp/terms');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'jwks_uri', @DataRecipientBaseUri + '/jwks');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'token_endpoint_auth_method', N'private_key_jwt');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'token_endpoint_auth_signing_alg', N'PS256');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'id_token_encrypted_response_alg', N'RSA-OAEP');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'id_token_encrypted_response_enc', N'A256GCM');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'id_token_signed_response_alg', N'PS256');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'request_object_signing_alg', N'PS256');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'legal_entity_id', @LegalEntityId);
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'legal_entity_name', @LegalEntityName);
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'recipient_base_uri', @DataRecipientBaseUri);
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'org_id', @NodeBrandID);

-- INSERT INTO [dbo].[ClientClaims]
--       ([ClientId],[Type],[Value])
-- VALUES
--       (@ClientId, N'org_id', @JavaBrandID);      
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'org_name', @NodeBrandName);
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'revocation_uri', @DataRecipientBaseUri + '/revocation');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'response_types', N'code;code id_token');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'authorization_signed_response_alg', N'PS256');

-- Add the clients into the software products table.
DELETE FROM [dbo].[SoftwareProducts] WHERE SoftwareProductId IN (@NodeSoftwareId, @JavaSoftwareId)



INSERT INTO [dbo].[SoftwareProducts]
      ([SoftwareProductId]
      ,[SoftwareProductName]
      ,[SoftwareProductDescription]
      ,[LogoUri]
      ,[Status]
      ,[LegalEntityId]
      ,[LegalEntityName]
      ,[LegalEntityStatus]
      ,[BrandId]
      ,[BrandName]
      ,[BrandStatus])
VALUES
      (@NodeSoftwareId
           , @NodeSoftwareName
           , @NodeSoftwareName
           , @LogoUri
           , 'ACTIVE'
           , @LegalEntityId
           , @LegalEntityName
           , 'ACTIVE'
           , @NodeBrandID
           , @NodeBrandName
           , 'ACTIVE')


-- INSERT INTO [dbo].[SoftwareProducts]
--       ([SoftwareProductId]
--       ,[SoftwareProductName]
--       ,[SoftwareProductDescription]
--       ,[LogoUri]
--       ,[Status]
--       ,[LegalEntityId]
--       ,[LegalEntityName]
--       ,[LegalEntityStatus]
--       ,[BrandId]
--       ,[BrandName]
--       ,[BrandStatus])
-- VALUES
--       (@JavaSoftwareId
--            , @JavaSoftwareName
--            , @JavaSoftwareName
--            , @LogoUri
--            , 'ACTIVE'
--            , @LegalEntityId
--            , @LegalEntityName
--            , 'ACTIVE'
--            , @JavaBrandID
--            , @JavaBrandName
--            , 'ACTIVE')

-- Update Other stuff
USE [cdr-mdr]
DELETE FROM dbo.[DataHolderBrand] WHERE DataHolderBrandId IN (@NodeBrandID, @JavaBrandID)
DELETE FROM dbo.[Registration] WHERE ClientId IN (@ClientId)

INSERT INTO dbo.DataHolderBrand
VALUES
      (@NodeBrandID,
            '{"DataHolderBrandId": "' + @NodeBrandID + '",
    "BrandName": "' + @NodeBrandName + '",
    "LegalEntity": {
        "LegalEntityId": "' +  @LegalEntityId + '",
        "LegalEntityName": "' + @LegalEntityName + '"
    },
    "Status": "ACTIVE",
    "EndpointDetail": {
        "Version": "1",
        "PublicBaseUri": "' + @NodeDataHolderBaseUri + '",
        "ResourceBaseUri": "' + @NodeDataHolderBaseUri + '",
        "InfoSecBaseUri": "' + @InfoSecBaseUri + '",
        "ExtensionBaseUri": "",
        "WebsiteUri": "https://www.consumerdatastandards.gov.au"
    },
    "AuthDetails": [
        {
            "RegisterUType": "SIGNED-JWT",
            "JwksEndpoint": "' + @DataRecipientBaseUri + '/jwks"
        }
    ],
    "LastUpdated": "2023-04-19T11:58:00Z"
}', null)

-- INSERT INTO dbo.DataHolderBrand
-- VALUES
--       (@JavaBrandID,
--             '{"DataHolderBrandId": "' + @JavaBrandID + '",
--     "BrandName": "' + @JavaBrandName + '",
--     "LegalEntity": {
--         "LegalEntityId": "' +  @LegalEntityId + '",
--         "LegalEntityName": "' + @LegalEntityName + '"
--     },
--     "Status": "ACTIVE",
--     "EndpointDetail": {
--         "Version": "1",
--         "PublicBaseUri": "' + @JavaDataHolderBaseUri + '",
--         "ResourceBaseUri": "' + @JavaDataHolderBaseUri + '",
--         "InfoSecBaseUri": "' + @InfoSecBaseUri + '",
--         "ExtensionBaseUri": "",
--         "WebsiteUri": "https://www.consumerdatastandards.gov.au"
--     },
--     "AuthDetails": [
--         {
--             "RegisterUType": "SIGNED-JWT",
--             "JwksEndpoint": "' + @DataRecipientBaseUri + '/jwks"
--         }
--     ],
--     "LastUpdated": "2023-04-19T11:58:00Z"
-- }', null)

INSERT INTO Registration (ClientId, JsonDocument, DataHolderBrandId)
VALUES (@ClientId,
'{"DataHolderBrandId": "' + @NodeBrandID + '",
    "BrandName": "' + @NodeBrandName + '",
    "MessageState": null,
    "LastUpdated": "2023-07-01T00:00:00",
    "ClientId": "' + @ClientId + '",
    "ClientIdIssuedAt": 1690595990,
    "ClientDescription": "A product to help you manage your budget",
    "ClientUri": "https://dsb/energy-app",
    "OrgId": "' + @OrganisationId + '",
    "OrgName": "Mock Finance Tools",
    "RedirectUris": [
        "' + @DataRecipientBaseUri + '/consent/callback"
    ],
    "LogoUri": "https://dsb/energy-app/img/logo.png",
    "TosUri": "https://dsb/energy-app/terms",
    "PolicyUri": "https://dsb/energy-app/policy",
    "JwksUri": "' + @DataRecipientBaseUri + '/jwks",
    "RevocationUri": "' + @DataRecipientBaseUri + '/revocation",
    "RecipientBaseUri": "' + @DataRecipientBaseUri + '",
    "TokenEndpointAuthSigningAlg": "PS256",
    "TokenEndpointAuthMethod": "private_key_jwt",
    "GrantTypes": [
        "client_credentials",
        "authorization_code",
        "refresh_token"
    ],
    "ResponseTypes": [
        "code id_token"
    ],
    "ApplicationType": "web",
    "IdTokenSignedResponseAlg": "PS256",
    "IdTokenEncryptedResponseAlg": "RSA-OAEP",
    "IdTokenEncryptedResponseEnc": "A256GCM",
    "AuthorizationSignedResponseAlg": null,
    "AuthorizationEncryptedResponseAlg": null,
    "AuthorizationEncryptedResponseEnc": null,
    "RequestObjectSigningAlg": "PS256",
    "SoftwareStatement": "eyJhbGciOiJQUzI1NiIsImtpZCI6IjIwM0E",
    "SoftwareId": "36094666-7e37-4717-8ab0-0c3d3485f56e", 
    "Scope": "openid profile common:customer.basic:read common:customer.detail:read bank:accounts.basic:read bank:accounts.detail:read bank:transactions:read bank:regular_payments:read bank:payees:read cdr:registration"}'
    ,@NodeBrandID)


-- INSERT INTO Registration (ClientId, JsonDocument, DataHolderBrandId)
-- VALUES (@ClientId,
-- '{"DataHolderBrandId": "' + @JavaBrandID + '",
--     "BrandName": "' + @JavaBrandName + '",
--     "MessageState": null,
--     "LastUpdated": "2023-07-01T00:00:00",
--     "ClientId": "' + @ClientId + '",
--     "ClientIdIssuedAt": 1690595990,
--     "ClientDescription": "A product to help you manage your budget",
--     "ClientUri": "https://dsb/energy-app",
--     "OrgId": "' + @OrganisationId + '",
--     "OrgName": "Mock Finance Tools",
--     "RedirectUris": [
--         "' + @DataRecipientBaseUri + '/consent/callback"
--     ],
--     "LogoUri": "https://dsb/energy-app/img/logo.png",
--     "TosUri": "https://dsb/energy-app/terms",
--     "PolicyUri": "https://dsb/energy-app/policy",
--     "JwksUri": "' + @DataRecipientBaseUri + '/jwks",
--     "RevocationUri": "' + @DataRecipientBaseUri + '/revocation",
--     "RecipientBaseUri": "' + @DataRecipientBaseUri + '",
--     "TokenEndpointAuthSigningAlg": "PS256",
--     "TokenEndpointAuthMethod": "private_key_jwt",
--     "GrantTypes": [
--         "client_credentials",
--         "authorization_code",
--         "refresh_token"
--     ],
--     "ResponseTypes": [
--         "code id_token"
--     ],
--     "ApplicationType": "web",
--     "IdTokenSignedResponseAlg": "PS256",
--     "IdTokenEncryptedResponseAlg": "RSA-OAEP",
--     "IdTokenEncryptedResponseEnc": "A256GCM",
--     "AuthorizationSignedResponseAlg": null,
--     "AuthorizationEncryptedResponseAlg": null,
--     "AuthorizationEncryptedResponseEnc": null,
--     "RequestObjectSigningAlg": "PS256",
--     "SoftwareStatement": "eyJhbGciOiJQUzI1NiIsImtpZCI6IjIwM0E",
--     "SoftwareId": "36094666-7e37-4717-8ab0-0c3d3485f56e", 
--     "Scope": "openid profile common:customer.basic:read common:customer.detail:read bank:accounts.basic:read bank:accounts.detail:read bank:transactions:read bank:regular_payments:read bank:payees:read cdr:registration"}'
--     ,@JavaBrandID)

