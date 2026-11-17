ALTER TYPE "public"."email_kind" ADD VALUE 'security';--> statement-breakpoint
CREATE TABLE "actor_backup_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "actor_backup_codes_code_hash_unique" UNIQUE("code_hash")
);
--> statement-breakpoint
CREATE TABLE "actor_passkeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" bigint DEFAULT 0 NOT NULL,
	"transports" text[] DEFAULT '{}'::text[] NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "actor_passkeys_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
ALTER TABLE "actor_accounts" ADD COLUMN "totp_secret" text;--> statement-breakpoint
ALTER TABLE "actor_accounts" ADD COLUMN "totp_pending_secret" text;--> statement-breakpoint
ALTER TABLE "actor_accounts" ADD COLUMN "totp_enabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "actor_accounts" ADD COLUMN "totp_last_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "actor_backup_codes" ADD CONSTRAINT "actor_backup_codes_account_id_actor_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."actor_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actor_passkeys" ADD CONSTRAINT "actor_passkeys_account_id_actor_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."actor_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actor_backup_codes_account_idx" ON "actor_backup_codes" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "actor_passkeys_account_idx" ON "actor_passkeys" USING btree ("account_id");