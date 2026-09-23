BEGIN;

-- تکمیل دستورات باقی‌مونده‌ی migration، با اسم درست جدول (Grade، نه grades)
ALTER TABLE "Grade" ADD COLUMN "categoryId" TEXT;

CREATE UNIQUE INDEX "categories_level_slug_key" ON "categories"("level", "slug");
CREATE UNIQUE INDEX "grade_attributes_value_kind_key" ON "grade_attributes"("value", "kind");
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");
CREATE INDEX "categories_level_isActive_sortOrder_idx" ON "categories"("level", "isActive", "sortOrder");
CREATE INDEX "grade_attributes_kind_idx" ON "grade_attributes"("kind");
CREATE INDEX "grades_categoryId_idx" ON "Grade"("categoryId");
CREATE INDEX "_GradeToGradeAttribute_B_index" ON "_GradeToGradeAttribute"("B");

ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Grade" ADD CONSTRAINT "grades_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_GradeToGradeAttribute" ADD CONSTRAINT "_GradeToGradeAttribute_A_fkey" FOREIGN KEY ("A") REFERENCES "Grade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_GradeToGradeAttribute" ADD CONSTRAINT "_GradeToGradeAttribute_B_fkey" FOREIGN KEY ("B") REFERENCES "grade_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
