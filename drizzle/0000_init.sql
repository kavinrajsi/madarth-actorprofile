CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'non_binary', 'other', 'prefer_not');--> statement-breakpoint
CREATE TYPE "public"."photo_kind" AS ENUM('headshot', 'gallery', 'full_length');--> statement-breakpoint
CREATE TYPE "public"."actor_status" AS ENUM('new', 'shortlisted', 'contacted', 'selected', 'not_suitable');--> statement-breakpoint
CREATE SEQUENCE "public"."actor_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "actor_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"kind" "photo_kind" NOT NULL,
	"blob_pathname" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_code" text DEFAULT ('MAD-' || to_char(now(), 'YY') || '-' || lpad(nextval('actor_code_seq')::text, 5, '0')) NOT NULL,
	"full_name" text NOT NULL,
	"age" integer NOT NULL,
	"gender" "gender" NOT NULL,
	"city" text NOT NULL,
	"city_normalized" text NOT NULL,
	"phone" text NOT NULL,
	"whatsapp" text NOT NULL,
	"email" text NOT NULL,
	"guardian_name" text,
	"guardian_phone" text,
	"guardian_consent" boolean,
	"instagram_handle" text,
	"instagram_url" text,
	"intro" text NOT NULL,
	"experience" text,
	"portfolio_links" text[] DEFAULT '{}'::text[] NOT NULL,
	"showreel_url" text,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"height_cm" integer,
	"profession" text,
	"availability" text,
	"willing_to_travel" boolean NOT NULL,
	"consent" boolean NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"consent_version" text NOT NULL,
	"status" "actor_status" DEFAULT 'new' NOT NULL,
	"notes" text,
	"possible_duplicate" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "actors_actor_code_unique" UNIQUE("actor_code")
);
--> statement-breakpoint
CREATE TABLE "rate_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"from_status" "actor_status",
	"to_status" "actor_status" NOT NULL,
	"by_email" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"email" text PRIMARY KEY NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "actor_photos" ADD CONSTRAINT "actor_photos_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_events" ADD CONSTRAINT "status_events_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actor_photos_actor_idx" ON "actor_photos" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "actors_status_idx" ON "actors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "actors_gender_idx" ON "actors" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "actors_age_idx" ON "actors" USING btree ("age");--> statement-breakpoint
CREATE INDEX "actors_city_idx" ON "actors" USING btree ("city_normalized");--> statement-breakpoint
CREATE INDEX "actors_languages_idx" ON "actors" USING gin ("languages");--> statement-breakpoint
CREATE INDEX "actors_created_idx" ON "actors" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "actors_email_idx" ON "actors" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "actors_phone_idx" ON "actors" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "rate_events_key_at_idx" ON "rate_events" USING btree ("key","at");--> statement-breakpoint
CREATE INDEX "status_events_actor_idx" ON "status_events" USING btree ("actor_id","at");