CREATE TYPE "public"."activity_actor" AS ENUM('actor', 'admin', 'system');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_type" "activity_actor" NOT NULL,
	"account_id" uuid,
	"admin_email" text,
	"subject_actor_id" uuid,
	"subject_code" text,
	"action" text NOT NULL,
	"details" jsonb,
	"ip" text,
	"user_agent" text,
	"device" text,
	"location" text
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_account_id_actor_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."actor_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_subject_actor_id_actors_id_fk" FOREIGN KEY ("subject_actor_id") REFERENCES "public"."actors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_account_idx" ON "activity_log" USING btree ("account_id","at");--> statement-breakpoint
CREATE INDEX "activity_subject_idx" ON "activity_log" USING btree ("subject_actor_id","at");--> statement-breakpoint
CREATE INDEX "activity_type_idx" ON "activity_log" USING btree ("actor_type","at");--> statement-breakpoint
CREATE INDEX "activity_admin_idx" ON "activity_log" USING btree ("admin_email","at");