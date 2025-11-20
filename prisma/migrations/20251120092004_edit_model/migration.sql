BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[MapSections] (
    [id] INT NOT NULL IDENTITY(1,1),
    [sectionId] INT NOT NULL,
    [subSectionId] INT NOT NULL,
    CONSTRAINT [MapSections_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[MapSections] ADD CONSTRAINT [MapSections_sectionId_fkey] FOREIGN KEY ([sectionId]) REFERENCES [dbo].[Sections]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MapSections] ADD CONSTRAINT [MapSections_subSectionId_fkey] FOREIGN KEY ([subSectionId]) REFERENCES [dbo].[SubSections]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
