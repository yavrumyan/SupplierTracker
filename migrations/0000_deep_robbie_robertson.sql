CREATE TABLE "compstyle_kievyan_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"qty" integer NOT NULL,
	"retail_price_amd" numeric(10, 2),
	CONSTRAINT "compstyle_kievyan_stock_product_name_unique" UNIQUE("product_name")
);
--> statement-breakpoint
CREATE TABLE "compstyle_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "compstyle_product_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" text,
	"product_name" varchar(200) NOT NULL,
	"stock" integer DEFAULT 0,
	"transit" integer DEFAULT 0,
	"retail_price_usd" numeric(10, 2),
	"retail_price_amd" numeric(10, 2),
	"dealer_price_1" numeric(10, 2),
	"dealer_price_2" numeric(10, 2),
	"cost" numeric(10, 2),
	"latest_purchase" numeric(10, 2),
	"latest_cost" numeric(10, 2),
	"ave_sales_price" numeric(10, 2),
	"actual_price" numeric(10, 2),
	"actual_cost" numeric(10, 2),
	"supplier" text,
	"last_updated" timestamp DEFAULT now(),
	CONSTRAINT "compstyle_product_list_product_name_unique" UNIQUE("product_name")
);
--> statement-breakpoint
CREATE TABLE "compstyle_purchase_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"price_usd" numeric(10, 2),
	"qty" integer NOT NULL,
	"sum_usd" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "compstyle_purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_number" text NOT NULL,
	"order_date" timestamp,
	"supplier" text,
	"contact_name" text,
	"location" text NOT NULL,
	"total_amount_usd" numeric(12, 2),
	CONSTRAINT "compstyle_purchase_orders_purchase_order_number_unique" UNIQUE("purchase_order_number")
);
--> statement-breakpoint
CREATE TABLE "compstyle_sales_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"price_usd" numeric(10, 2),
	"qty" integer NOT NULL,
	"sum_usd" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "compstyle_sales_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_order_number" text NOT NULL,
	"order_date" timestamp,
	"customer" text,
	"contact_name" text,
	"location" text NOT NULL,
	"total_amount_usd" numeric(12, 2),
	CONSTRAINT "compstyle_sales_orders_sales_order_number_unique" UNIQUE("sales_order_number")
);
--> statement-breakpoint
CREATE TABLE "compstyle_sevan_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"qty" integer NOT NULL,
	"retail_price_amd" numeric(10, 2),
	CONSTRAINT "compstyle_sevan_stock_product_name_unique" UNIQUE("product_name")
);
--> statement-breakpoint
CREATE TABLE "compstyle_total_procurement" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"qty_purchased" integer NOT NULL,
	"purchase_price_usd" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "compstyle_total_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"qty_sold" integer NOT NULL,
	"sale_price_usd" numeric(10, 2),
	"cost_price_usd" numeric(10, 2),
	"profit_per_unit" numeric(10, 2),
	"total_profit" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "compstyle_total_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"sku" text NOT NULL,
	"qty_in_stock" integer NOT NULL,
	"retail_price_usd" numeric(10, 2),
	"retail_price_amd" numeric(10, 2),
	"wholesale_price1" numeric(10, 2),
	"wholesale_price2" numeric(10, 2),
	"current_cost" numeric(10, 2),
	CONSTRAINT "compstyle_total_stock_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "compstyle_transit" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_name" varchar(200) NOT NULL,
	"qty" integer NOT NULL,
	"purchase_price_usd" numeric(10, 2),
	"purchase_price_amd" numeric(10, 2),
	"current_cost" numeric(10, 2),
	"purchase_order_number" text,
	"destination_location" text,
	"supplier" text,
	CONSTRAINT "compstyle_transit_product_name_unique" UNIQUE("product_name")
);
--> statement-breakpoint
CREATE TABLE "cost_calculation_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"filename" text NOT NULL,
	"file_path" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"file_type" text,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"supplier_ids" jsonb NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'sent'
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"content" text NOT NULL,
	"source" text NOT NULL,
	"received_at" timestamp DEFAULT now(),
	"tags" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"item_number" integer NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"sum" numeric(12, 2) NOT NULL,
	"approximate_cost" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"order_number" text NOT NULL,
	"status" text DEFAULT 'draft',
	"total_amount" numeric(12, 2),
	"total_cost" numeric(12, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "price_list_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "price_list_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"price_list_file_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"brand" text,
	"category" text,
	"price" numeric(10, 2),
	"stock" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_index" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"source_type" text NOT NULL,
	"source_id" integer,
	"supplier" text NOT NULL,
	"category" text,
	"brand" text,
	"model" text,
	"product_name" text,
	"price" text,
	"currency" text,
	"stock" text,
	"moq" text,
	"warranty" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"website" text,
	"email" text,
	"phone" text,
	"whatsapp" text,
	"reputation" integer,
	"working_style" jsonb DEFAULT '[]'::jsonb,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"brands" jsonb DEFAULT '[]'::jsonb,
	"comments" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "cost_calculation_files" ADD CONSTRAINT "cost_calculation_files_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_files" ADD CONSTRAINT "price_list_files_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_price_list_file_id_price_list_files_id_fk" FOREIGN KEY ("price_list_file_id") REFERENCES "public"."price_list_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_list_items" ADD CONSTRAINT "price_list_items_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_index" ADD CONSTRAINT "search_index_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;