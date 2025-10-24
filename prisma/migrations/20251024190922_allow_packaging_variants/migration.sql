-- DropIndex
DROP INDEX "Beer_name_brewery_key";

-- CreateIndex
CREATE UNIQUE INDEX "Beer_name_brewery_containerSize_containerType_key" ON "Beer"("name", "brewery", "containerSize", "containerType");
