ALTER TABLE "Product" ADD COLUMN "size" TEXT;

CREATE INDEX "Product_categoryId_size_idx" ON "Product"("categoryId", "size");
