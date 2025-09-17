/*
  Warnings:

  - The values [IMAGEshape] on the enum `ShapeType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ShapeType_new" AS ENUM ('RECTANGLE', 'CIRCLE', 'ARROW', 'DIAMOND', 'PENCIL', 'TEXT', 'LINE', 'FREEHAND');
ALTER TABLE "public"."Shape" ALTER COLUMN "type" TYPE "public"."ShapeType_new" USING ("type"::text::"public"."ShapeType_new");
ALTER TYPE "public"."ShapeType" RENAME TO "ShapeType_old";
ALTER TYPE "public"."ShapeType_new" RENAME TO "ShapeType";
DROP TYPE "public"."ShapeType_old";
COMMIT;
