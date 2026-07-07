CREATE TABLE "auth_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"type" varchar(16) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "auth_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "bond_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"bond_id" integer,
	"date" date NOT NULL,
	"price" double precision,
	"yield" double precision
);
--> statement-breakpoint
CREATE TABLE "crypto_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"crypto_id" integer NOT NULL,
	"date" date NOT NULL,
	"open" double precision NOT NULL,
	"high" double precision NOT NULL,
	"low" double precision NOT NULL,
	"close" double precision NOT NULL,
	"volume" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cryptos" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(16) NOT NULL,
	"name" varchar(80) NOT NULL,
	"category" varchar(32) NOT NULL,
	"network" varchar(32),
	"price" double precision NOT NULL,
	"price_usd" double precision NOT NULL,
	"prev_price" double precision,
	"change" double precision DEFAULT 0,
	"change_pct" double precision DEFAULT 0,
	"high_24h" double precision,
	"low_24h" double precision,
	"year_high" double precision,
	"year_low" double precision,
	"market_cap" double precision,
	"volume_24h" double precision,
	"circulating_supply" double precision,
	"rank" integer,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	"active" boolean DEFAULT true,
	CONSTRAINT "cryptos_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "fund_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"fund_id" integer NOT NULL,
	"date" date NOT NULL,
	"close" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funds" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(16) NOT NULL,
	"name" varchar(140) NOT NULL,
	"type" varchar(16) NOT NULL,
	"category" varchar(48) NOT NULL,
	"manager" varchar(80),
	"price" double precision NOT NULL,
	"prev_price" double precision,
	"nav" double precision,
	"change" double precision DEFAULT 0,
	"change_pct" double precision DEFAULT 0,
	"high_52" double precision,
	"low_52" double precision,
	"aum" double precision,
	"expense_ratio" double precision,
	"ytd_return" double precision,
	"units_outstanding" double precision,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	"active" boolean DEFAULT true,
	CONSTRAINT "funds_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"pair" varchar(16) NOT NULL,
	"rate" double precision NOT NULL,
	"change" double precision DEFAULT 0,
	"change_pct" double precision DEFAULT 0,
	CONSTRAINT "fx_rates_pair_unique" UNIQUE("pair")
);
--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"portfolio_id" integer,
	"security_type" varchar(12) NOT NULL,
	"ref_id" integer,
	"symbol" varchar(32) NOT NULL,
	"quantity" double precision NOT NULL,
	"avg_cost" double precision NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "index_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"index_id" integer NOT NULL,
	"date" date NOT NULL,
	"close" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indices" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(16) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"value" double precision,
	"prev_close" double precision,
	"change" double precision,
	"change_pct" double precision,
	"year_high" double precision,
	"year_low" double precision,
	CONSTRAINT "indices_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "ipos" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(140) NOT NULL,
	"symbol" varchar(16) NOT NULL,
	"type" varchar(24) NOT NULL,
	"status" varchar(12) DEFAULT 'upcoming' NOT NULL,
	"price_low" double precision,
	"price_high" double precision,
	"shares_offered" double precision,
	"amount_raised" double precision,
	"subscription_pct" double precision,
	"open_date" date,
	"close_date" date,
	"listing_date" date,
	"exchange" varchar(16) DEFAULT 'Main',
	"sector" varchar(48),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "market_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"time" varchar(12),
	"title" varchar(200) NOT NULL,
	"category" varchar(32) NOT NULL,
	"description" text,
	"related_symbol" varchar(32),
	"impact" varchar(8) DEFAULT 'medium',
	"region" varchar(24) DEFAULT 'Kenya',
	"value" varchar(48)
);
--> statement-breakpoint
CREATE TABLE "mpesa_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"portfolio_id" integer,
	"checkout_request_id" varchar(80),
	"merchant_request_id" varchar(80),
	"phone" varchar(20) NOT NULL,
	"amount" double precision NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"receipt" varchar(32),
	"result_code" integer,
	"account_reference" varchar(32),
	"mode" varchar(12) DEFAULT 'simulation',
	"created_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "news_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(240) NOT NULL,
	"summary" text,
	"body" text,
	"source" varchar(80),
	"category" varchar(40),
	"related_symbol" varchar(16),
	"sentiment" varchar(12),
	"published_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pending_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"portfolio_id" integer NOT NULL,
	"security_type" varchar(12) NOT NULL,
	"ref_id" integer,
	"symbol" varchar(32) NOT NULL,
	"name" varchar(160),
	"action" varchar(8) NOT NULL,
	"order_type" varchar(12) NOT NULL,
	"quantity" double precision NOT NULL,
	"trigger_price" double precision NOT NULL,
	"status" varchar(12) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"filled_at" timestamp with time zone,
	"filled_price" double precision
);
--> statement-breakpoint
CREATE TABLE "portfolio_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"portfolio_id" integer NOT NULL,
	"date" date NOT NULL,
	"total_value" double precision NOT NULL,
	"cash_balance" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(80) NOT NULL,
	"description" text,
	"base_currency" varchar(8) DEFAULT 'KES',
	"cash_balance" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "price_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"security_type" varchar(12) NOT NULL,
	"ref_id" integer,
	"symbol" varchar(32) NOT NULL,
	"target_price" double precision NOT NULL,
	"direction" varchar(4) DEFAULT 'up' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"date" date NOT NULL,
	"open" double precision NOT NULL,
	"high" double precision NOT NULL,
	"low" double precision NOT NULL,
	"close" double precision NOT NULL,
	"volume" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(16) NOT NULL,
	"name" varchar(160) NOT NULL,
	"isin" varchar(24),
	"sector" varchar(48) NOT NULL,
	"industry" varchar(96),
	"exchange" varchar(24) DEFAULT 'NSE' NOT NULL,
	"country" varchar(48) DEFAULT 'Kenya' NOT NULL,
	"currency" varchar(8) DEFAULT 'KES' NOT NULL,
	"shares_outstanding" double precision,
	"eps" double precision,
	"dividend_yield" double precision DEFAULT 0,
	"pe_ratio" double precision,
	"pb_ratio" double precision,
	"market_cap" double precision,
	"description" text,
	"open" double precision,
	"high" double precision,
	"low" double precision,
	"price" double precision,
	"prev_close" double precision,
	"change" double precision,
	"change_pct" double precision,
	"volume" double precision DEFAULT 0,
	"turnover" double precision DEFAULT 0,
	"year_high" double precision,
	"year_low" double precision,
	"updated_at" timestamp with time zone DEFAULT now(),
	"active" boolean DEFAULT true,
	CONSTRAINT "stocks_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"portfolio_id" integer,
	"security_type" varchar(12) NOT NULL,
	"ref_id" integer,
	"symbol" varchar(32) NOT NULL,
	"action" varchar(8) NOT NULL,
	"quantity" double precision NOT NULL,
	"price" double precision NOT NULL,
	"fees" double precision DEFAULT 0,
	"date" timestamp with time zone DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "treasury_bonds" (
	"id" serial PRIMARY KEY NOT NULL,
	"bond_number" varchar(32) NOT NULL,
	"name" varchar(160),
	"tenor_years" integer NOT NULL,
	"coupon_rate" double precision NOT NULL,
	"coupon_frequency" integer DEFAULT 2,
	"auction_date" date,
	"value_date" date,
	"maturity_date" date NOT NULL,
	"currency" varchar(8) DEFAULT 'KES',
	"face_value" double precision DEFAULT 50000,
	"is_infrastructure" boolean DEFAULT false,
	"is_green" boolean DEFAULT false,
	"listed_on_nse" boolean DEFAULT false,
	"clean_price" double precision,
	"dirty_price" double precision,
	"accrued_interest" double precision,
	"yield_to_maturity" double precision,
	"duration" double precision,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "treasury_bonds_bond_number_unique" UNIQUE("bond_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(160) NOT NULL,
	"name" varchar(80) NOT NULL,
	"password_hash" varchar(120) NOT NULL,
	"email_verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"security_type" varchar(12) NOT NULL,
	"ref_id" integer,
	"symbol" varchar(32) NOT NULL,
	"name" varchar(160),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bond_quotes" ADD CONSTRAINT "bond_quotes_bond_id_treasury_bonds_id_fk" FOREIGN KEY ("bond_id") REFERENCES "public"."treasury_bonds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crypto_quotes" ADD CONSTRAINT "crypto_quotes_crypto_id_cryptos_id_fk" FOREIGN KEY ("crypto_id") REFERENCES "public"."cryptos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_quotes" ADD CONSTRAINT "fund_quotes_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "index_quotes" ADD CONSTRAINT "index_quotes_index_id_indices_id_fk" FOREIGN KEY ("index_id") REFERENCES "public"."indices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mpesa_payments" ADD CONSTRAINT "mpesa_payments_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_orders" ADD CONSTRAINT "pending_orders_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_quotes" ADD CONSTRAINT "stock_quotes_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "at_token_uq" ON "auth_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "at_user_type_idx" ON "auth_tokens" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "bq_bond_date_idx" ON "bond_quotes" USING btree ("bond_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "cq_crypto_date_uq" ON "crypto_quotes" USING btree ("crypto_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "fq_fund_date_uq" ON "fund_quotes" USING btree ("fund_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "holdings_port_type_ref_uq" ON "holdings" USING btree ("portfolio_id","security_type","ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "iq_idx_date_uq" ON "index_quotes" USING btree ("index_id","date");--> statement-breakpoint
CREATE INDEX "ipo_close_idx" ON "ipos" USING btree ("close_date");--> statement-breakpoint
CREATE INDEX "me_date_idx" ON "market_events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "po_port_idx" ON "pending_orders" USING btree ("portfolio_id");--> statement-breakpoint
CREATE INDEX "po_status_idx" ON "pending_orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ps_port_date_uq" ON "portfolio_snapshots" USING btree ("portfolio_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "sq_stock_date_uq" ON "stock_quotes" USING btree ("stock_id","date");--> statement-breakpoint
CREATE INDEX "sq_date_idx" ON "stock_quotes" USING btree ("date");