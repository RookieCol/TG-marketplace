CREATE TYPE "public"."order_status" AS ENUM('pending_payment', 'paid', 'accepted', 'on_the_way', 'delivered', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('preroll', 'gummy', 'oil', 'other');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" serial NOT NULL,
	"telegram_user_id" bigint NOT NULL,
	"telegram_username" text DEFAULT '' NOT NULL,
	"items" jsonb NOT NULL,
	"delivery_address" text NOT NULL,
	"delivery_note" text DEFAULT '' NOT NULL,
	"subtotal_usd" numeric(10, 2) NOT NULL,
	"delivery_fee_usd" numeric(10, 2) NOT NULL,
	"total_usd" numeric(10, 2) NOT NULL,
	"ton_address" text DEFAULT '' NOT NULL,
	"ton_tx_hash" text,
	"status" "order_status" DEFAULT 'pending_payment' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" "product_category" NOT NULL,
	"price_usd" numeric(10, 2) NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
