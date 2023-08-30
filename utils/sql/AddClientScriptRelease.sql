USE [cdr-auth-server]

DECLARE @ClientId NVARCHAR(450) = N'77831c42-7e8b-457a-93b2-d714bb3b2bc6'
DECLARE @OrganisationId NVARCHAR(450) = N'5242a9d7-4c5d-43c7-a78a-844e352c7593'
DECLARE @LegalEntityId NVARCHAR(450) = N'8ecd3c03-1638-4936-97c3-76d2f3ac9d0d'
DECLARE @LegalEntityName NVARCHAR(450) = N'DSB Data Recipient'
DECLARE @BrandId NVARCHAR(450) = N'67e23b31-f5a4-4f5b-b8ec-95869292026c'
DECLARE @BrandName NVARCHAR(450) = N'DSB Energy Provider'
DECLARE @SoftwareId NVARCHAR(450) = N'36094666-7e37-4717-8ab0-0c3d3485f56e'
DECLARE @SoftwareName NVARCHAR(450) = N'DSB Test Software'
DECLARE @DataRecipientBaseUri NVARCHAR(450) = N'https://mock-data-recipient:9001'
DECLARE @DataHolderBaseUri NVARCHAR(450) = N'https://mock-data-holder:3005'
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
      (@ClientId, 1667260800, @SoftwareName, @SoftwareName)



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
      (@ClientId, 'scope', 'profile openid cdr:registration common:customer.basic:read common:customer.detail:read bank:accounts.basic:read bank:accounts.detail:read bank:transactions:read bank:payees:read bank:regular_payments:read energy:electricity.servicepoints.basic:read energy:electricity.servicepoints.detail:read energy:electricity.usage:read energy:electricity.der:read energy:accounts.basic:read energy:accounts.detail:read energy:accounts.paymentschedule:read energy:accounts.concessions:read energy:billing:read');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, 'application_type', N'web');
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, 'software_id', @SoftwareId);
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, 'software_statement', N'eyJhbGciOiJQUzI1NiIsImtpZCI6IjU0MkE5QjkxNjAwNDg4MDg4Q0Q0RDgxNjkxNkE5RjQ0ODhERDI2NTEiLCJ0eXAiOiJKV1QifQ.ewogICJyZWNpcGllbnRfYmFzZV91cmkiOiAiaHR0cHM6Ly9kci5kZXYuY2Ryc2FuZGJveC5nb3YuYXUiLAogICJsZWdhbF9lbnRpdHlfaWQiOiAiMThiNzVhNzYtNTgyMS00YzllLWI0NjUtNDcwOTI5MWNmMGY0IiwKICAibGVnYWxfZW50aXR5X25hbWUiOiAiU2FuZGJveCBEYXRhIFJlY2lwaWVudCIsCiAgImlzcyI6ICJjZHItcmVnaXN0ZXIiLAogICJpYXQiOiAxNjQ0NDk5NDI5LAogICJleHAiOiAxNjQ0NTAwMDI5LAogICJqdGkiOiAiOWZmMjRiMmI4N2YyNGY5ZmI1MzJkYjZmZmY1YTk1MjQiLAogICJvcmdfaWQiOiAiZmZiMWM4YmEtMjc5ZS00NGQ4LTk2ZjAtMWJjMzRhNmI0MzZmIiwKICAib3JnX25hbWUiOiAiU01EUiIsCiAgImNsaWVudF9uYW1lIjogIk15RGF0YVJlY2lwaWVudCIsCiAgImNsaWVudF9kZXNjcmlwdGlvbiI6ICJBIHByb2R1Y3QgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgZWNvc3lzdGVtIiwKICAiY2xpZW50X3VyaSI6ICJodHRwczovL21vY2tzb2Z0d2FyZS9teWJ1ZGdldGFwcCIsCiAgInJlZGlyZWN0X3VyaXMiOiBbCiAgICAiaHR0cHM6Ly9kci5kZXYuY2Ryc2FuZGJveC5nb3YuYXUvY29uc2VudC9jYWxsYmFjayIKICBdLAogICJsb2dvX3VyaSI6ICJodHRwczovL21vY2tzb2Z0d2FyZS9teWJ1ZGdldGFwcC9pbWcvbG9nby5wbmciLAogICJ0b3NfdXJpIjogImh0dHBzOi8vbW9ja3NvZnR3YXJlL215YnVkZ2V0YXBwL3Rlcm1zIiwKICAicG9saWN5X3VyaSI6ICJodHRwczovL21vY2tzb2Z0d2FyZS9teWJ1ZGdldGFwcC9wb2xpY3kiLAogICJqd2tzX3VyaSI6ICJodHRwczovL2RyLmRldi5jZHJzYW5kYm94Lmdvdi5hdS9qd2tzIiwKICAicmV2b2NhdGlvbl91cmkiOiAiaHR0cHM6Ly9kci5kZXYuY2Ryc2FuZGJveC5nb3YuYXUvcmV2b2NhdGlvbiIsCiAgInNvZnR3YXJlX2lkIjogImM2MzI3Zjg3LTY4N2EtNDM2OS05OWE0LWVhYWNkM2JiODIxMCIsCiAgInNvZnR3YXJlX3JvbGVzIjogImRhdGEtcmVjaXBpZW50LXNvZnR3YXJlLXByb2R1Y3QiLAogICJzY29wZSI6ICJvcGVuaWQgcHJvZmlsZSBjb21tb246Y3VzdG9tZXIuYmFzaWM6cmVhZCBjb21tb246Y3VzdG9tZXIuZGV0YWlsOnJlYWQgYmFuazphY2NvdW50cy5iYXNpYzpyZWFkIGJhbms6YWNjb3VudHMuZGV0YWlsOnJlYWQgYmFuazp0cmFuc2FjdGlvbnM6cmVhZCBiYW5rOnJlZ3VsYXJfcGF5bWVudHM6cmVhZCBiYW5rOnBheWVlczpyZWFkIGVuZXJneTphY2NvdW50cy5iYXNpYzpyZWFkIGVuZXJneTphY2NvdW50cy5kZXRhaWw6cmVhZCBlbmVyZ3k6YWNjb3VudHMuY29uY2Vzc2lvbnM6cmVhZCBlbmVyZ3k6YWNjb3VudHMucGF5bWVudHNjaGVkdWxlOnJlYWQgZW5lcmd5OmJpbGxpbmc6cmVhZCBlbmVyZ3k6ZWxlY3RyaWNpdHkuc2VydmljZXBvaW50cy5iYXNpYzpyZWFkIGVuZXJneTplbGVjdHJpY2l0eS5zZXJ2aWNlcG9pbnRzLmRldGFpbDpyZWFkIGVuZXJneTplbGVjdHJpY2l0eS5kZXI6cmVhZCBlbmVyZ3k6ZWxlY3RyaWNpdHkudXNhZ2U6cmVhZCBjZHI6cmVnaXN0cmF0aW9uIgp9.EIi7JtG2p3tsqQAZcoTQC0xekiC9K3KEejr51vNMa7OF4AtuEascI7_Xwao7O3gzOukvE-fv1HrAbcRaWU2Ba5_eqLJdI5f9EbWMjCW5tOmWB0gQjHNumLd4M5a5R2rAvnNoJ4-27esD7iWkYAwJtHkYL-Nj5G7g09NMCxfv0pQcej3xCSYH1Z4OBn_qwNpbfFGZZPCQU6mJ_CVNLLvjiI9fCUFlvcfdeCq5GSKHollpQZlm2AGOION14AQjPhCdUsBqIEHHC-bc1udVfQEg_ckcYHuD15Qtk0rHxVyzuXltznrMPNm3laKs0RDrUFD7Ndail9lJDjL5lhc4g-waMQ');
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
      (@ClientId, N'org_id', @BrandId);
INSERT INTO [dbo].[ClientClaims]
      ([ClientId],[Type],[Value])
VALUES
      (@ClientId, N'org_name', @BrandName);
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
DELETE FROM [dbo].[SoftwareProducts] WHERE SoftwareProductId IN (@SoftwareId)



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
      (@SoftwareId
           , @SoftwareName
           , @SoftwareName
           , @LogoUri
           , 'ACTIVE'
           , @LegalEntityId
           , @LegalEntityName
           , 'ACTIVE'
           , @BrandId
           , @BrandName
           , 'ACTIVE')



-- Update Other stuff
USE [cdr-mdr]
DELETE FROM dbo.[DataHolderBrand] WHERE DataHolderBrandId IN (@BrandId)
DELETE FROM dbo.[Registration] WHERE ClientId IN (@ClientId)

INSERT INTO dbo.DataHolderBrand
VALUES
      (@BrandId,
            '{"DataHolderBrandId": "' + @BrandId + '",
    "BrandName": "' + @BrandName + '",
    "LegalEntity": {
        "LegalEntityId": "' +  @LegalEntityId + '",
        "LegalEntityName": "' + @LegalEntityName + '"
    },
    "Status": "ACTIVE",
    "EndpointDetail": {
        "Version": "1",
        "PublicBaseUri": "' + @DataHolderBaseUri + '",
        "ResourceBaseUri": "' + @DataHolderBaseUri + '",
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


INSERT INTO Registration (ClientId, JsonDocument, DataHolderBrandId)
VALUES (@ClientId,
'{"DataHolderBrandId": "' + @BrandId + '",
    "BrandName": "' + @BrandName + '",
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
    ,@BrandId)

--     UPDATE dbo.Registration
--     SET JsonDocument = '{"DataHolderBrandId": "' + @BrandId + '",
--     "BrandName": "' + @BrandName + '",
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
--     "SoftwareStatement": "eyJhbGciOiJQUzI1NiIsImtpZCI6IjIwM0E0MURDMTc0M0Y5NzIxMkJGQkYwMUI3Nzg5NUNEOUY0NDVCRkIiLCJ0eXAiOiJKV1QifQ.ewogICJpc3MiOiAiY2RyLXJlZ2lzdGVyIiwKICAiaWF0IjogMTY4OTk5MDc4NSwKICAiZXhwIjogMTY4OTk5MTM4NSwKICAianRpIjogIjQwZjk0NjliYTFjMjQyYTE5MmY3YmNmOWIzNDY0NWQ0IiwKICAib3JnX2lkIjogImZmYjFjOGJhLTI3OWUtNDRkOC05NmYwLTFiYzM0YTZiNDM2ZiIsCiAgIm9yZ19uYW1lIjogIk1vY2sgRmluYW5jZSBUb29scyIsCiAgImNsaWVudF9uYW1lIjogIk15QnVkZ2V0SGVscGVyIiwKICAiY2xpZW50X2Rlc2NyaXB0aW9uIjogIkEgcHJvZHVjdCB0byBoZWxwIHlvdSBtYW5hZ2UgeW91ciBidWRnZXQiLAogICJjbGllbnRfdXJpIjogImh0dHBzOi8vbW9ja3NvZnR3YXJlL215YnVkZ2V0YXBwIiwKICAicmVkaXJlY3RfdXJpcyI6IFsKICAgICJodHRwczovL21vY2stZGF0YS1yZWNpcGllbnQ6OTAwMS9jb25zZW50L2NhbGxiYWNrIgogIF0sCiAgImxvZ29fdXJpIjogImh0dHBzOi8vbW9ja3NvZnR3YXJlL215YnVkZ2V0YXBwL2ltZy9sb2dvLnBuZyIsCiAgInRvc191cmkiOiAiaHR0cHM6Ly9tb2Nrc29mdHdhcmUvbXlidWRnZXRhcHAvdGVybXMiLAogICJwb2xpY3lfdXJpIjogImh0dHBzOi8vbW9ja3NvZnR3YXJlL215YnVkZ2V0YXBwL3BvbGljeSIsCiAgImp3a3NfdXJpIjogImh0dHBzOi8vbW9jay1kYXRhLXJlY2lwaWVudDo5MDAxL2p3a3MiLAogICJyZXZvY2F0aW9uX3VyaSI6ICJodHRwczovL21vY2stZGF0YS1yZWNpcGllbnQ6OTAwMS9yZXZvY2F0aW9uIiwKICAicmVjaXBpZW50X2Jhc2VfdXJpIjogImh0dHBzOi8vbW9jay1kYXRhLXJlY2lwaWVudDo5MDAxIiwKICAic29mdHdhcmVfaWQiOiAiYzYzMjdmODctNjg3YS00MzY5LTk5YTQtZWFhY2QzYmI4MjEwIiwKICAic29mdHdhcmVfcm9sZXMiOiAiZGF0YS1yZWNpcGllbnQtc29mdHdhcmUtcHJvZHVjdCIsCiAgInNjb3BlIjogIm9wZW5pZCBwcm9maWxlIGNvbW1vbjpjdXN0b21lci5iYXNpYzpyZWFkIGNvbW1vbjpjdXN0b21lci5kZXRhaWw6cmVhZCBiYW5rOmFjY291bnRzLmJhc2ljOnJlYWQgYmFuazphY2NvdW50cy5kZXRhaWw6cmVhZCBiYW5rOnRyYW5zYWN0aW9uczpyZWFkIGJhbms6cmVndWxhcl9wYXltZW50czpyZWFkIGJhbms6cGF5ZWVzOnJlYWQgZW5lcmd5OmFjY291bnRzLmJhc2ljOnJlYWQgZW5lcmd5OmFjY291bnRzLmRldGFpbDpyZWFkIGVuZXJneTphY2NvdW50cy5jb25jZXNzaW9uczpyZWFkIGVuZXJneTphY2NvdW50cy5wYXltZW50c2NoZWR1bGU6cmVhZCBlbmVyZ3k6YmlsbGluZzpyZWFkIGVuZXJneTplbGVjdHJpY2l0eS5zZXJ2aWNlcG9pbnRzLmJhc2ljOnJlYWQgZW5lcmd5OmVsZWN0cmljaXR5LnNlcnZpY2Vwb2ludHMuZGV0YWlsOnJlYWQgZW5lcmd5OmVsZWN0cmljaXR5LmRlcjpyZWFkIGVuZXJneTplbGVjdHJpY2l0eS51c2FnZTpyZWFkIGNkcjpyZWdpc3RyYXRpb24iLAogICJsZWdhbF9lbnRpdHlfaWQiOiAiMThiNzVhNzYtNTgyMS00YzllLWI0NjUtNDcwOTI5MWNmMGY0IiwKICAibGVnYWxfZW50aXR5X25hbWUiOiAiTW9jayBTb2Z0d2FyZSBDb21wYW55Igp9.EM2CPHNijm61yJL3Ao9W8Z4M_vkDG93VTDJR1GlrhhD2JTqgwN_awPH_leG28KHMbMAox7JfMuDTFJINSvkp2n2nmuGqWv2-TrXrVNbpqjs_Vp-w2ftfNF3IwSLulMXhCI8iifbswxFkQnORWYO_ryWropremKPXCa9257Y8ArbYIQzBmUyNELyAShmpTywmrzI4GNkNfctym7sVDq-aUmVqqM4JJw9D11Ki_LM8DdVF0Bg525jaCtSWp_KRnXlFYrEUZVtI3Qyu83m35WariBihBcMsNIyot7HaTz8F-zT-Uy3hOoOEXzYlqtzOrQ2dzsvp4N5AC0omy0rFihljTg",
--     "SoftwareId": "36094666-7e37-4717-8ab0-0c3d3485f56e", 
--     "Scope": "openid profile common:customer.basic:read common:customer.detail:read bank:accounts.basic:read bank:accounts.detail:read bank:transactions:read bank:regular_payments:read bank:payees:read cdr:registration"}'
