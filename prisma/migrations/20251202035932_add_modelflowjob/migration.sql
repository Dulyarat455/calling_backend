BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[FlowJob] (
    [id] INT NOT NULL IDENTITY(1,1),
    [groupId] INT NOT NULL,
    [fromNodeId] INT NOT NULL,
    [toNodeId] INT NOT NULL,
    [State] NVARCHAR(1000) NOT NULL CONSTRAINT [FlowJob_State_df] DEFAULT 'use',
    [status] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [FlowJob_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[FlowJob] ADD CONSTRAINT [FlowJob_groupId_fkey] FOREIGN KEY ([groupId]) REFERENCES [dbo].[Groups]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[FlowJob] ADD CONSTRAINT [FlowJob_fromNodeId_fkey] FOREIGN KEY ([fromNodeId]) REFERENCES [dbo].[CallNodes]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[FlowJob] ADD CONSTRAINT [FlowJob_toNodeId_fkey] FOREIGN KEY ([toNodeId]) REFERENCES [dbo].[CallNodes]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
