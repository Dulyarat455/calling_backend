BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[CallNodes] ADD [State] NVARCHAR(1000) CONSTRAINT [CallNodes_State_df] DEFAULT 'use';

-- AlterTable
ALTER TABLE [dbo].[Groups] ADD [State] NVARCHAR(1000) CONSTRAINT [Groups_State_df] DEFAULT 'use';

-- AlterTable
ALTER TABLE [dbo].[Machines] ADD [State] NVARCHAR(1000) CONSTRAINT [Machines_State_df] DEFAULT 'use';

-- AlterTable
ALTER TABLE [dbo].[UserGroups] ADD [State] NVARCHAR(1000) CONSTRAINT [UserGroups_State_df] DEFAULT 'use';

-- AlterTable
ALTER TABLE [dbo].[UserSections] ADD [State] NVARCHAR(1000) CONSTRAINT [UserSections_State_df] DEFAULT 'use';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
