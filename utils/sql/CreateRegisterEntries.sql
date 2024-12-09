-- USE [cdr-auth-server]

DECLARE @ClientId NVARCHAR(450) = N'77831c42-7e8b-457a-93b2-d714bb3b2bc6'
DECLARE @OrganisationId NVARCHAR(450) = N'5242a9d7-4c5d-43c7-a78a-844e352c7593'
DECLARE @LegalEntityId NVARCHAR(450) = N'85d03955-f3c2-4159-8c3d-dd2a46cba3b0'
DECLARE @LegalEntityName NVARCHAR(450) = N'Data Standards Body Australia'
DECLARE @NodeBrandId NVARCHAR(450) = N'67e23b31-f5a4-4f5b-b8ec-95869292026c'
DECLARE @MockAdrBrandId NVARCHAR(450) = N'51524491-f8a3-4107-9323-dbbf7051143d'
DECLARE @JavaBrandId NVARCHAR(450) = N'c90f6f6f-6b38-40bb-8de5-1dfcddf1188f'
DECLARE @NodeBrandName NVARCHAR(450) = N'DSB NodeJS DH'
DECLARE @JavaBrandName NVARCHAR(450) = N'DSB Java Provider'
DECLARE @NodeSoftwareId NVARCHAR(450) = N'36094666-7e37-4717-8ab0-0c3d3485f56e'
DECLARE @NodeSoftwareName NVARCHAR(450) = N'DSB Node Software'
DECLARE @NodeSoftwareDescription NVARCHAR(1000) = N'A NodeJS data server hosting Banking and Energy data'
DECLARE @JavaSoftwareId NVARCHAR(450) = N'39ea251a-7612-4fbb-8c95-57a07232c608'
DECLARE @JavaSoftwareName NVARCHAR(450) = N'DSB Java Software'
DECLARE @DataRecipientBaseUri NVARCHAR(450) = N'https://dsb-sample-adr:3006'
DECLARE @NodeDataHolderBaseUri NVARCHAR(450) = N'http://dsb-nodejs-resource-api:3005/'
DECLARE @JavaDataHolderBaseUri NVARCHAR(450) = N'https://java-data-holder:3006'
DECLARE @InfoSecBaseUri NVARCHAR(450) = N'http://panva-oidc:3000'
-- Set this to wherever the data recipient client is running
DECLARE @LogoUri NVARCHAR(450) = @DataRecipientBaseUri + '/logo.png'
DECLARE @ParticipationIdBankingHolder NVARCHAR(450) = N'3a051840-d1ad-47a8-8753-d785557d65e6'
DECLARE @ParticipationIdEnergyHolder NVARCHAR(450) = N'33eda2be-6f8e-4ce3-882f-a500dc5d53f9'
DECLARE @ParticipationIdEnergyRecipient NVARCHAR(450) = N'd489eb1d-fea8-4e6f-b47a-5bf9d51fd605'
DECLARE @ParticipationIdBankingRecipient NVARCHAR(450) = N'ae0937c1-b3e3-4bf8-9ed8-380f7a063b68'
----DECLARE @LegalEntityId NVARCHAR(450) = N'85d03955-f3c2-4159-8c3d-dd2a46cba3b0'
--DECLARE @LegalEntityName NVARCHAR(200) = N'Data Standards Body Australia'
DECLARE @BrandIdEnergy NVARCHAR(450) = N'13219e0b-4b29-433d-b367-fdc967dd9d10'
DECLARE @BrandIdBanking NVARCHAR(450) = N'91799179-0c4a-493e-a1d7-a58b391d458a'
DECLARE @LastUpdated DATETIME2(7)='2024-11-22 00:00:00.0000000'
--DECLARE @LogoUri NVARCHAR(1000)='https://mylog.png'



-- Set up the register
use [cdr-register];

-- get rid of all old data
DELETE from dbo.SoftwareProduct;
DELETE FROM dbo.Endpoint;
DELETE FROM dbo.Brand;
DELETE FROM dbo.Participation;
DELETE FROM dbo.LegalEntity;


INSERT INTO dbo.LegalEntity (
    LegalEntityId, LegalEntityName, LogoUri, RegistrationNumber,
    RegistrationDate, RegisteredCountry, Abn, Acn,
    Arbn, OrganisationTypeId, AccreditationNumber, AccreditationLevelId, AnzsicDivision)
VALUES (@LegalEntityId, @LegalEntityName, 'https://consumerdatastandards.gov.au/', NULL,NULL,'Australia',NULL,NULL,NULL,5,NULL,1,NULL)

-- insert the data holders, one for banking one for energy
INSERT INTO dbo.Participation (ParticipationId, LegalEntityId, ParticipationTypeId,IndustryId, StatusId)
VALUES (@ParticipationIdBankingHolder,@LegalEntityId,1,1,1)
INSERT INTO dbo.Participation (ParticipationId, LegalEntityId, ParticipationTypeId,IndustryId, StatusId)
VALUES (@ParticipationIdEnergyHolder,@LegalEntityId,1,2,1)

-- insert a data recipient
INSERT INTO dbo.Participation (ParticipationId, LegalEntityId, ParticipationTypeId,IndustryId, StatusId)
VALUES (@ParticipationIdEnergyRecipient,@LegalEntityId,2,2,1)
INSERT INTO dbo.Participation (ParticipationId, LegalEntityId, ParticipationTypeId,IndustryId, StatusId)
VALUES (@ParticipationIdBankingRecipient,@LegalEntityId,2,1,1)

INSERT INTO dbo.Brand (BrandId, BrandName, LogoUri, BrandStatusId, ParticipationId, LastUpdated)
VALUES (@NodeBrandId,'DSB NodeJS DH','https://consumerdatastandards.gov.au/',1,@ParticipationIdBankingHolder,@LastUpdated)
-- INSERT INTO dbo.Brand (BrandId, BrandName, LogoUri, BrandStatusId, ParticipationId, LastUpdated)
-- VALUES (@NodeBrandId,'DSB NodeJS DH','https://consumerdatastandards.gov.au/',1,@ParticipationIdEnergyHolder,@LastUpdated)

INSERT INTO dbo.Brand (BrandId, BrandName, LogoUri, BrandStatusId, ParticipationId, LastUpdated)
VALUES (@MockAdrBrandId,'DSB Mock ADR','https://consumerdatastandards.gov.au/',1,@ParticipationIdBankingRecipient,@LastUpdated)
-- INSERT INTO dbo.Brand (BrandId, BrandName, LogoUri, BrandStatusId, ParticipationId, LastUpdated)
-- VALUES (@MockAdrBrandId,'DSB Mock ADR','https://consumerdatastandards.gov.au/',1,@ParticipationIdEnergyRecipient,@LastUpdated)

INSERT INTO dbo.Endpoint (BrandId, Version, PublicBaseUri, ResourceBaseUri, InfosecBaseUri,ExtensionBaseUri,WebsiteUri)
VALUES (@NodeBrandId,1,'http://dsb-nodejs-resource-api:3005/','http://dsb-nodejs-resource-api:3005/','http://panva-oidc:3000', NUll, 'https://consumerdatastandards.gov.au/')

-- INSERT INTO dbo.Endpoint (BrandId, Version, PublicBaseUri, ResourceBaseUri, InfosecBaseUri,ExtensionBaseUri,WebsiteUri)
-- VALUES (@NodeBrandId,1,'http://dsb-nodejs-resource-api:3005/','http://dsb-nodejs-resource-api:3005/','http://panva-oidc:3000', NUll, 'https://consumerdatastandards.gov.au/')

INSERT INTO dbo.SoftwareProduct (
    SoftwareProductId,
    SoftwareProductName,
    SoftwareProductDescription,
    LogoUri,
    SectorIdentifierUri,
    ClientUri,
    TosUri,
    PolicyUri,
    RecipientBaseUri,
    RevocationUri,
    RedirectUris,
    JwksUri,
    scope,
    StatusId,
    BrandId
)
VALUES (
    @ClientId,
    'DSB Mock ADR',
    'A Mock ADR hosting Banking and Energy data',
    @LogoUri,
    null,
    'https://dsb-sample-adr:3006',
    null,
    null,
    null,
    'https://dsb-sample-adr:3006/revocation',
    'https://dsb-sample-adr:3006/callback',
    'https://dsb-sample-adr:3006/jwks',
    'openid profile energy:electricity.servicepoints.basic:read energy:electricity.servicepoints.detail:read energy:electricity.usage:read energy:electricity.der:read energy:accounts.basic:read energy:accounts.detail:read energy:accounts.paymentschedule:read energy:accounts.concessions:read energy:billing:read openid profile bank:accounts.basic:read bank:accounts.detail:read bank:transactions:read bank:regular_payments:read bank:payees:read openid profile common:customer.basic:read common:customer.detail:read cdr:registration ',
    1,
    @MockAdrBrandId
    )