-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "employee_code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "department" VARCHAR(50) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "token_hash" VARCHAR(64) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("token_hash")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "asset_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "storage_location" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" SERIAL NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "borrower_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "purpose" VARCHAR(200) NOT NULL,
    "due_date" DATE NOT NULL,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMPTZ(6),
    "reject_reason" VARCHAR(200),
    "lent_at" TIMESTAMPTZ(6),
    "returned_at" TIMESTAMPTZ(6),
    "cancelled_by" INTEGER,
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(20) NOT NULL,
    "target_id" INTEGER NOT NULL,
    "detail" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_employee_code" ON "users"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_sessions_user_id" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_categories_name" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_equipment_asset_code" ON "equipment"("asset_code");

-- CreateIndex
CREATE INDEX "idx_equipment_category_id" ON "equipment"("category_id");

-- CreateIndex
CREATE INDEX "idx_loans_equipment_id_status" ON "loans"("equipment_id", "status");

-- CreateIndex
CREATE INDEX "idx_loans_borrower_id_created_at" ON "loans"("borrower_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_loans_status_due_date" ON "loans"("status", "due_date");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_audit_logs_target" ON "audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor_id" ON "audit_logs"("actor_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "fk_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "fk_equipment_category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "fk_loans_equipment_id" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "fk_loans_borrower_id" FOREIGN KEY ("borrower_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "fk_loans_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "fk_loans_cancelled_by" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "fk_audit_logs_actor_id" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ここから下は手書きで追加した SQL。
-- CHECK 制約と部分ユニークインデックスは schema.prisma では表現できないため、
-- マイグレーションに直接書いている（docs/05_table_definitions.md）。

-- CHECK 制約
ALTER TABLE "users" ADD CONSTRAINT "chk_users_role"
  CHECK ("role" IN ('member', 'admin'));

ALTER TABLE "equipment" ADD CONSTRAINT "chk_equipment_quantity"
  CHECK ("quantity" BETWEEN 1 AND 99);

ALTER TABLE "equipment" ADD CONSTRAINT "chk_equipment_status"
  CHECK ("status" IN ('active', 'suspended'));

ALTER TABLE "loans" ADD CONSTRAINT "chk_loans_status"
  CHECK ("status" IN ('pending', 'approved', 'lent', 'returned', 'rejected', 'cancelled'));

ALTER TABLE "loans" ADD CONSTRAINT "chk_loans_reject_reason"
  CHECK ("status" <> 'rejected' OR "reject_reason" IS NOT NULL);

ALTER TABLE "loans" ADD CONSTRAINT "chk_loans_lent_at"
  CHECK ("status" NOT IN ('lent', 'returned') OR "lent_at" IS NOT NULL);

ALTER TABLE "loans" ADD CONSTRAINT "chk_loans_returned_at"
  CHECK ("status" <> 'returned' OR "returned_at" IS NOT NULL);

ALTER TABLE "audit_logs" ADD CONSTRAINT "chk_audit_logs_action"
  CHECK ("action" IN (
    'equipment.create', 'equipment.update', 'equipment.delete',
    'loan.request', 'loan.approve', 'loan.reject',
    'loan.cancel', 'loan.lend', 'loan.return'
  ));

ALTER TABLE "audit_logs" ADD CONSTRAINT "chk_audit_logs_target_type"
  CHECK ("target_type" IN ('equipment', 'loan'));

-- 部分ユニークインデックス（BR-04）
-- 同じ社員が、同じ備品について未完了の申請を 2 件以上持てないようにする。
CREATE UNIQUE INDEX "uq_loans_active_equipment_borrower"
  ON "loans" ("equipment_id", "borrower_id")
  WHERE "status" IN ('pending', 'approved', 'lent');
