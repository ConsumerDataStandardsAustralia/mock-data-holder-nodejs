DECLARE @ClientId1 NVARCHAR(450) = N'77831c42-7e8b-457a-93b2-d714bb3b2bc6'
DECLARE @LegalEntityId NVARCHAR(450) = N'61f1f708-fd80-476f-a8ce-e31b94c13cc6'
DECLARE @LegalEntityName NVARCHAR(450) = N'DSB Data Recipient'
DECLARE @BrandId NVARCHAR(450) = N'117f845a-3127-4454-a7a6-a56577bf6462'
DECLARE @BrandName NVARCHAR(450) = N'DSB'
DECLARE @SoftwareId1 NVARCHAR(450) = N'36094666-7e37-4717-8ab0-0c3d3485f56e'
DECLARE @SoftwareName1 NVARCHAR(450) = N'DSB Test Software'
DECLARE @DataRecipientBaseUri NVARCHAR(450) = N'https://localhost:3005' -- Set this to wherever the data recipient client is running
DECLARE @LogoUri NVARCHAR(450) = @DataRecipientBaseUri + '/logo.png'

 

-- Remove existing client data for FAPI clients.
DELETE FROM dbo.[Clients] WHERE ClientId IN (@ClientId1)
DELETE FROM dbo.[ClientClaims] WHERE ClientId IN (@ClientId1)

 

-- Insert client data for FAPI testing.
INSERT [dbo].[Clients] ([ClientId], [ClientIdIssuedAt], [ClientName], [ClientDescription]) 
VALUES (@ClientId1, 1667260800, @SoftwareName1, @SoftwareName1)

 

INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, 'grant_types', 'client_credentials;refresh_token;authorization_code');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, 'redirect_uris', @DataRecipientBaseUri + '/callback');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, 'scope', 'profile openid cdr:registration common:customer.basic:read common:customer.detail:read bank:accounts.basic:read bank:accounts.detail:read bank:transactions:read bank:payees:read bank:regular_payments:read energy:electricity.servicepoints.basic:read energy:electricity.servicepoints.detail:read energy:electricity.usage:read energy:electricity.der:read energy:accounts.basic:read energy:accounts.detail:read energy:accounts.paymentschedule:read energy:accounts.concessions:read energy:billing:read');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, 'application_type', N'web');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, 'software_id', @SoftwareId1);
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, 'software_statement', N'eyJhbGciOiJQUzI1NiIsImtpZCI6IjU0MkE5QjkxNjAwNDg4MDg4Q0Q0RDgxNjkxNkE5RjQ0ODhERDI2NTEiLCJ0eXAiOiJKV1QifQ.ewogICJyZWNpcGllbnRfYmFzZV91cmkiOiAiaHR0cHM6Ly9kci5kZXYuY2Ryc2FuZGJveC5nb3YuYXUiLAogICJsZWdhbF9lbnRpdHlfaWQiOiAiMThiNzVhNzYtNTgyMS00YzllLWI0NjUtNDcwOTI5MWNmMGY0IiwKICAibGVnYWxfZW50aXR5X25hbWUiOiAiU2FuZGJveCBEYXRhIFJlY2lwaWVudCIsCiAgImlzcyI6ICJjZHItcmVnaXN0ZXIiLAogICJpYXQiOiAxNjQ0NDk5NDI5LAogICJleHAiOiAxNjQ0NTAwMDI5LAogICJqdGkiOiAiOWZmMjRiMmI4N2YyNGY5ZmI1MzJkYjZmZmY1YTk1MjQiLAogICJvcmdfaWQiOiAiZmZiMWM4YmEtMjc5ZS00NGQ4LTk2ZjAtMWJjMzRhNmI0MzZmIiwKICAib3JnX25hbWUiOiAiU01EUiIsCiAgImNsaWVudF9uYW1lIjogIk15RGF0YVJlY2lwaWVudCIsCiAgImNsaWVudF9kZXNjcmlwdGlvbiI6ICJBIHByb2R1Y3QgdG8gaW50ZXJhY3Qgd2l0aCB0aGUgZWNvc3lzdGVtIiwKICAiY2xpZW50X3VyaSI6ICJodHRwczovL21vY2tzb2Z0d2FyZS9teWJ1ZGdldGFwcCIsCiAgInJlZGlyZWN0X3VyaXMiOiBbCiAgICAiaHR0cHM6Ly9kci5kZXYuY2Ryc2FuZGJveC5nb3YuYXUvY29uc2VudC9jYWxsYmFjayIKICBdLAogICJsb2dvX3VyaSI6ICJodHRwczovL21vY2tzb2Z0d2FyZS9teWJ1ZGdldGFwcC9pbWcvbG9nby5wbmciLAogICJ0b3NfdXJpIjogImh0dHBzOi8vbW9ja3NvZnR3YXJlL215YnVkZ2V0YXBwL3Rlcm1zIiwKICAicG9saWN5X3VyaSI6ICJodHRwczovL21vY2tzb2Z0d2FyZS9teWJ1ZGdldGFwcC9wb2xpY3kiLAogICJqd2tzX3VyaSI6ICJodHRwczovL2RyLmRldi5jZHJzYW5kYm94Lmdvdi5hdS9qd2tzIiwKICAicmV2b2NhdGlvbl91cmkiOiAiaHR0cHM6Ly9kci5kZXYuY2Ryc2FuZGJveC5nb3YuYXUvcmV2b2NhdGlvbiIsCiAgInNvZnR3YXJlX2lkIjogImM2MzI3Zjg3LTY4N2EtNDM2OS05OWE0LWVhYWNkM2JiODIxMCIsCiAgInNvZnR3YXJlX3JvbGVzIjogImRhdGEtcmVjaXBpZW50LXNvZnR3YXJlLXByb2R1Y3QiLAogICJzY29wZSI6ICJvcGVuaWQgcHJvZmlsZSBjb21tb246Y3VzdG9tZXIuYmFzaWM6cmVhZCBjb21tb246Y3VzdG9tZXIuZGV0YWlsOnJlYWQgYmFuazphY2NvdW50cy5iYXNpYzpyZWFkIGJhbms6YWNjb3VudHMuZGV0YWlsOnJlYWQgYmFuazp0cmFuc2FjdGlvbnM6cmVhZCBiYW5rOnJlZ3VsYXJfcGF5bWVudHM6cmVhZCBiYW5rOnBheWVlczpyZWFkIGVuZXJneTphY2NvdW50cy5iYXNpYzpyZWFkIGVuZXJneTphY2NvdW50cy5kZXRhaWw6cmVhZCBlbmVyZ3k6YWNjb3VudHMuY29uY2Vzc2lvbnM6cmVhZCBlbmVyZ3k6YWNjb3VudHMucGF5bWVudHNjaGVkdWxlOnJlYWQgZW5lcmd5OmJpbGxpbmc6cmVhZCBlbmVyZ3k6ZWxlY3RyaWNpdHkuc2VydmljZXBvaW50cy5iYXNpYzpyZWFkIGVuZXJneTplbGVjdHJpY2l0eS5zZXJ2aWNlcG9pbnRzLmRldGFpbDpyZWFkIGVuZXJneTplbGVjdHJpY2l0eS5kZXI6cmVhZCBlbmVyZ3k6ZWxlY3RyaWNpdHkudXNhZ2U6cmVhZCBjZHI6cmVnaXN0cmF0aW9uIgp9.EIi7JtG2p3tsqQAZcoTQC0xekiC9K3KEejr51vNMa7OF4AtuEascI7_Xwao7O3gzOukvE-fv1HrAbcRaWU2Ba5_eqLJdI5f9EbWMjCW5tOmWB0gQjHNumLd4M5a5R2rAvnNoJ4-27esD7iWkYAwJtHkYL-Nj5G7g09NMCxfv0pQcej3xCSYH1Z4OBn_qwNpbfFGZZPCQU6mJ_CVNLLvjiI9fCUFlvcfdeCq5GSKHollpQZlm2AGOION14AQjPhCdUsBqIEHHC-bc1udVfQEg_ckcYHuD15Qtk0rHxVyzuXltznrMPNm3laKs0RDrUFD7Ndail9lJDjL5lhc4g-waMQ');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'logo_uri', @LogoUri);
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'policy_uri', N'https://mocksoftware/mybudgetapp/policy');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'tos_uri', N'https://mocksoftware/mybudgetapp/terms');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'jwks_uri', @DataRecipientBaseUri + '/jwks');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'token_endpoint_auth_method', N'private_key_jwt');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'token_endpoint_auth_signing_alg', N'PS256');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'id_token_encrypted_response_alg', N'RSA-OAEP');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'id_token_encrypted_response_enc', N'A256GCM');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'id_token_signed_response_alg', N'PS256');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'request_object_signing_alg', N'PS256');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'legal_entity_id', @LegalEntityId);
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'legal_entity_name', @LegalEntityName);
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'recipient_base_uri', @DataRecipientBaseUri);
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'org_id', @BrandId);
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'org_name', @BrandName);
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'revocation_uri', @DataRecipientBaseUri + '/revocation');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'response_types', N'code;code id_token');
INSERT INTO [dbo].[ClientClaims] ([ClientId],[Type],[Value]) VALUES (@ClientId1, N'authorization_signed_response_alg', N'PS256');

 

-- Add the clients into the software products table.
DELETE FROM [dbo].[SoftwareProducts] WHERE SoftwareProductId IN (@SoftwareId1)

 

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
           (@SoftwareId1
           ,@SoftwareName1
           ,@SoftwareName1
           ,@LogoUri
           ,'ACTIVE'
           ,@LegalEntityId
           ,@LegalEntityName
           ,'ACTIVE'
           ,@BrandId
           ,@BrandName
           ,'ACTIVE')

