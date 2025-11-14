BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[CallNodes] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL,
    [label] NVARCHAR(1000) NOT NULL,
    [sectionId] INT NOT NULL,
    [groupId] INT NOT NULL,
    [isActive] INT NOT NULL CONSTRAINT [CallNodes_isActive_df] DEFAULT 1,
    CONSTRAINT [CallNodes_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Machines] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL,
    [groupId] INT NOT NULL,
    [isActive] INT NOT NULL CONSTRAINT [Machines_isActive_df] DEFAULT 1,
    CONSTRAINT [Machines_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[CallNodes] ADD CONSTRAINT [CallNodes_sectionId_fkey] FOREIGN KEY ([sectionId]) REFERENCES [dbo].[UserSections]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CallNodes] ADD CONSTRAINT [CallNodes_groupId_fkey] FOREIGN KEY ([groupId]) REFERENCES [dbo].[Groups]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Machines] ADD CONSTRAINT [Machines_groupId_fkey] FOREIGN KEY ([groupId]) REFERENCES [dbo].[Groups]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
