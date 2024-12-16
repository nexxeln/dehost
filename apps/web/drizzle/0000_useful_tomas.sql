CREATE TABLE "deployments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"webpage_id" integer,
	"transaction_hash" varchar(66) NOT NULL,
	"deployed_at" timestamp DEFAULT now(),
	"deployment_url" varchar(255) NOT NULL,
	"filecoin_info" text
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"balance" integer DEFAULT 0 NOT NULL,
	"staked_amount" integer DEFAULT 0 NOT NULL,
	"rewards_earned" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"address" varchar(42) NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_login" timestamp
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"is_verified" boolean DEFAULT false NOT NULL,
	"code" varchar(6) NOT NULL,
	"auth_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webpages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" text,
	"domain" varchar(255) NOT NULL,
	"cid" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_webpage_id_webpages_id_fk" FOREIGN KEY ("webpage_id") REFERENCES "public"."webpages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webpages" ADD CONSTRAINT "webpages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;