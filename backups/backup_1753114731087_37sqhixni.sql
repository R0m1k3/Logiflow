--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.3

-- Started on 2025-07-21 16:18:51 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS neondb;
--
-- TOC entry 3688 (class 1262 OID 16389)
-- Name: neondb; Type: DATABASE; Schema: -; Owner: neondb_owner
--

CREATE DATABASE neondb WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C.UTF-8';


ALTER DATABASE neondb OWNER TO neondb_owner;

\connect neondb

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 24577)
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.calendar_events (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    user_id integer NOT NULL,
    store_id integer NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    is_all_day boolean DEFAULT false,
    type text DEFAULT 'event'::text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.calendar_events OWNER TO neondb_owner;

--
-- TOC entry 215 (class 1259 OID 24576)
-- Name: calendar_events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.calendar_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendar_events_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3690 (class 0 OID 0)
-- Dependencies: 215
-- Name: calendar_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.calendar_events_id_seq OWNED BY public.calendar_events.id;


--
-- TOC entry 218 (class 1259 OID 24590)
-- Name: client_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.client_orders (
    id integer NOT NULL,
    order_number text NOT NULL,
    customer_id integer NOT NULL,
    store_id integer NOT NULL,
    user_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total_amount numeric(10,2),
    order_date timestamp without time zone DEFAULT now() NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.client_orders OWNER TO neondb_owner;

--
-- TOC entry 217 (class 1259 OID 24589)
-- Name: client_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.client_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_orders_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3691 (class 0 OID 0)
-- Dependencies: 217
-- Name: client_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.client_orders_id_seq OWNED BY public.client_orders.id;


--
-- TOC entry 220 (class 1259 OID 24605)
-- Name: command_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.command_items (
    id integer NOT NULL,
    command_id integer NOT NULL,
    product_name text NOT NULL,
    product_code text,
    quantity integer NOT NULL,
    unit_price numeric(10,2),
    total_price numeric(10,2),
    expiry_date timestamp without time zone
);


ALTER TABLE public.command_items OWNER TO neondb_owner;

--
-- TOC entry 219 (class 1259 OID 24604)
-- Name: command_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.command_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.command_items_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3692 (class 0 OID 0)
-- Dependencies: 219
-- Name: command_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.command_items_id_seq OWNED BY public.command_items.id;


--
-- TOC entry 222 (class 1259 OID 24614)
-- Name: commands; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.commands (
    id integer NOT NULL,
    command_number text NOT NULL,
    supplier_id integer NOT NULL,
    store_id integer NOT NULL,
    user_id integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total_amount numeric(10,2),
    notes text,
    order_date timestamp without time zone DEFAULT now() NOT NULL,
    expected_delivery_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.commands OWNER TO neondb_owner;

--
-- TOC entry 221 (class 1259 OID 24613)
-- Name: commands_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.commands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.commands_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3693 (class 0 OID 0)
-- Dependencies: 221
-- Name: commands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.commands_id_seq OWNED BY public.commands.id;


--
-- TOC entry 247 (class 1259 OID 57526)
-- Name: customer_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customer_orders (
    id integer NOT NULL,
    order_taker character varying NOT NULL,
    customer_name character varying NOT NULL,
    customer_phone character varying NOT NULL,
    customer_email character varying,
    product_designation text NOT NULL,
    product_reference character varying,
    gencode character varying NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    supplier_id integer NOT NULL,
    status character varying DEFAULT 'En attente de Commande'::character varying NOT NULL,
    deposit numeric(10,2) DEFAULT 0.00,
    is_promotional_price boolean DEFAULT false,
    customer_notified boolean DEFAULT false,
    notes text,
    group_id integer NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.customer_orders OWNER TO neondb_owner;

--
-- TOC entry 246 (class 1259 OID 57525)
-- Name: customer_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customer_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_orders_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3694 (class 0 OID 0)
-- Dependencies: 246
-- Name: customer_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customer_orders_id_seq OWNED BY public.customer_orders.id;


--
-- TOC entry 224 (class 1259 OID 24629)
-- Name: customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    address text,
    store_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customers OWNER TO neondb_owner;

--
-- TOC entry 223 (class 1259 OID 24628)
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3695 (class 0 OID 0)
-- Dependencies: 223
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- TOC entry 262 (class 1259 OID 819214)
-- Name: database_backups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.database_backups (
    id character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    description text,
    size bigint DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    tables_count integer DEFAULT 0,
    status character varying(50) DEFAULT 'creating'::character varying
);


ALTER TABLE public.database_backups OWNER TO neondb_owner;

--
-- TOC entry 259 (class 1259 OID 73734)
-- Name: deliveries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.deliveries (
    id integer NOT NULL,
    order_id integer,
    supplier_id integer NOT NULL,
    group_id integer NOT NULL,
    scheduled_date date NOT NULL,
    delivered_date timestamp without time zone,
    quantity integer NOT NULL,
    unit character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    bl_number character varying,
    bl_amount numeric(10,2),
    invoice_reference character varying,
    invoice_amount numeric(10,2),
    reconciled boolean DEFAULT false,
    validated_at timestamp without time zone,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deliveries_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'planned'::character varying, 'delivered'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.deliveries OWNER TO neondb_owner;

--
-- TOC entry 258 (class 1259 OID 73733)
-- Name: deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deliveries_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3696 (class 0 OID 0)
-- Dependencies: 258
-- Name: deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.deliveries_id_seq OWNED BY public.deliveries.id;


--
-- TOC entry 226 (class 1259 OID 24654)
-- Name: delivery_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.delivery_items (
    id integer NOT NULL,
    delivery_id integer NOT NULL,
    command_item_id integer,
    product_name text NOT NULL,
    quantity_ordered integer NOT NULL,
    quantity_delivered integer NOT NULL,
    quantity_damaged integer DEFAULT 0,
    notes text
);


ALTER TABLE public.delivery_items OWNER TO neondb_owner;

--
-- TOC entry 225 (class 1259 OID 24653)
-- Name: delivery_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.delivery_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_items_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3697 (class 0 OID 0)
-- Dependencies: 225
-- Name: delivery_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.delivery_items_id_seq OWNED BY public.delivery_items.id;


--
-- TOC entry 249 (class 1259 OID 57542)
-- Name: dlc_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.dlc_products (
    id integer NOT NULL,
    name character varying NOT NULL,
    gencode character varying,
    dlc_date date,
    quantity integer,
    store_id integer,
    created_at timestamp without time zone DEFAULT now(),
    group_id integer,
    created_by character varying,
    status character varying DEFAULT 'active'::character varying,
    validated_by character varying,
    expiry_date date,
    product_code character varying(255),
    description text,
    supplier_id integer,
    product_name character varying(255),
    date_type character varying(50) DEFAULT 'DLC'::character varying,
    unit character varying(50) DEFAULT 'unité'::character varying,
    location character varying(255) DEFAULT 'Magasin'::character varying,
    alert_threshold integer DEFAULT 15,
    notes text,
    updated_at timestamp without time zone DEFAULT now(),
    validated_at timestamp without time zone
);


ALTER TABLE public.dlc_products OWNER TO neondb_owner;

--
-- TOC entry 248 (class 1259 OID 57541)
-- Name: dlc_products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.dlc_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dlc_products_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3698 (class 0 OID 0)
-- Dependencies: 248
-- Name: dlc_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.dlc_products_id_seq OWNED BY public.dlc_products.id;


--
-- TOC entry 237 (class 1259 OID 57451)
-- Name: groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying NOT NULL,
    color character varying DEFAULT '#3b82f6'::character varying,
    address text,
    phone character varying,
    email character varying,
    nocodb_config_id integer,
    nocodb_table_id character varying,
    nocodb_table_name character varying,
    invoice_column_name character varying DEFAULT 'Ref Facture'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.groups OWNER TO neondb_owner;

--
-- TOC entry 236 (class 1259 OID 57450)
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3699 (class 0 OID 0)
-- Dependencies: 236
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- TOC entry 228 (class 1259 OID 24677)
-- Name: invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number text NOT NULL,
    command_id integer,
    delivery_id integer,
    store_id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    total_amount numeric(10,2),
    status text DEFAULT 'draft'::text NOT NULL,
    issue_date timestamp without time zone DEFAULT now() NOT NULL,
    due_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.invoices OWNER TO neondb_owner;

--
-- TOC entry 227 (class 1259 OID 24676)
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3700 (class 0 OID 0)
-- Dependencies: 227
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- TOC entry 239 (class 1259 OID 57464)
-- Name: nocodb_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.nocodb_config (
    id integer NOT NULL,
    name character varying NOT NULL,
    base_url character varying NOT NULL,
    project_id character varying NOT NULL,
    api_token character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.nocodb_config OWNER TO neondb_owner;

--
-- TOC entry 238 (class 1259 OID 57463)
-- Name: nocodb_config_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.nocodb_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nocodb_config_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3701 (class 0 OID 0)
-- Dependencies: 238
-- Name: nocodb_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.nocodb_config_id_seq OWNED BY public.nocodb_config.id;


--
-- TOC entry 243 (class 1259 OID 57488)
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    supplier_id integer NOT NULL,
    group_id integer NOT NULL,
    planned_date date NOT NULL,
    quantity integer,
    unit character varying,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'planned'::character varying, 'delivered'::character varying])::text[])))
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- TOC entry 242 (class 1259 OID 57487)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3702 (class 0 OID 0)
-- Dependencies: 242
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 255 (class 1259 OID 57581)
-- Name: permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying NOT NULL,
    display_name character varying NOT NULL,
    description text,
    category character varying NOT NULL,
    action character varying NOT NULL,
    resource character varying NOT NULL,
    is_system boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.permissions OWNER TO neondb_owner;

--
-- TOC entry 254 (class 1259 OID 57580)
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3703 (class 0 OID 0)
-- Dependencies: 254
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- TOC entry 245 (class 1259 OID 57513)
-- Name: publicities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.publicities (
    id integer NOT NULL,
    pub_number character varying NOT NULL,
    designation text NOT NULL,
    title character varying,
    description text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    year integer NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.publicities OWNER TO neondb_owner;

--
-- TOC entry 244 (class 1259 OID 57512)
-- Name: publicities_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.publicities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.publicities_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3704 (class 0 OID 0)
-- Dependencies: 244
-- Name: publicities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.publicities_id_seq OWNED BY public.publicities.id;


--
-- TOC entry 257 (class 1259 OID 57615)
-- Name: publicity_participations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.publicity_participations (
    publicity_id integer NOT NULL,
    group_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.publicity_participations OWNER TO neondb_owner;

--
-- TOC entry 256 (class 1259 OID 57609)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.role_permissions OWNER TO neondb_owner;

--
-- TOC entry 253 (class 1259 OID 57565)
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying NOT NULL,
    display_name character varying NOT NULL,
    description text,
    color character varying DEFAULT '#6b7280'::character varying,
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- TOC entry 252 (class 1259 OID 57564)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3705 (class 0 OID 0)
-- Dependencies: 252
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 230 (class 1259 OID 24692)
-- Name: sav_tickets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sav_tickets (
    id integer NOT NULL,
    ticket_number text NOT NULL,
    customer_id integer,
    store_id integer NOT NULL,
    user_id integer NOT NULL,
    assigned_user_id integer,
    title text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    category text,
    resolution text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sav_tickets OWNER TO neondb_owner;

--
-- TOC entry 229 (class 1259 OID 24691)
-- Name: sav_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sav_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sav_tickets_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3706 (class 0 OID 0)
-- Dependencies: 229
-- Name: sav_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sav_tickets_id_seq OWNED BY public.sav_tickets.id;


--
-- TOC entry 233 (class 1259 OID 32770)
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- TOC entry 234 (class 1259 OID 57427)
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- TOC entry 232 (class 1259 OID 24707)
-- Name: stores; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stores (
    id integer NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    email text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.stores OWNER TO neondb_owner;

--
-- TOC entry 231 (class 1259 OID 24706)
-- Name: stores_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stores_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3707 (class 0 OID 0)
-- Dependencies: 231
-- Name: stores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stores_id_seq OWNED BY public.stores.id;


--
-- TOC entry 241 (class 1259 OID 57476)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying NOT NULL,
    contact character varying,
    phone character varying,
    has_dlc boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.suppliers OWNER TO neondb_owner;

--
-- TOC entry 240 (class 1259 OID 57475)
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3708 (class 0 OID 0)
-- Dependencies: 240
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- TOC entry 251 (class 1259 OID 57552)
-- Name: tasks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    assigned_to character varying,
    due_date date,
    priority character varying DEFAULT 'medium'::character varying,
    status character varying DEFAULT 'todo'::character varying,
    store_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by character varying,
    group_id integer,
    completed_at timestamp without time zone,
    completed_by character varying(255)
);


ALTER TABLE public.tasks OWNER TO neondb_owner;

--
-- TOC entry 250 (class 1259 OID 57551)
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3709 (class 0 OID 0)
-- Dependencies: 250
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- TOC entry 261 (class 1259 OID 720923)
-- Name: user_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_groups (
    user_id character varying(255) NOT NULL,
    group_id integer NOT NULL,
    assigned_by character varying(255),
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_groups OWNER TO neondb_owner;

--
-- TOC entry 260 (class 1259 OID 720910)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_roles (
    user_id character varying(255) NOT NULL,
    role_id integer NOT NULL,
    assigned_by character varying(255),
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_roles OWNER TO neondb_owner;

--
-- TOC entry 235 (class 1259 OID 57435)
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    username character varying,
    email character varying,
    name character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    password character varying,
    role character varying DEFAULT 'employee'::character varying NOT NULL,
    password_changed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- TOC entry 3307 (class 2604 OID 24580)
-- Name: calendar_events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.calendar_events ALTER COLUMN id SET DEFAULT nextval('public.calendar_events_id_seq'::regclass);


--
-- TOC entry 3312 (class 2604 OID 24593)
-- Name: client_orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_orders ALTER COLUMN id SET DEFAULT nextval('public.client_orders_id_seq'::regclass);


--
-- TOC entry 3317 (class 2604 OID 24608)
-- Name: command_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.command_items ALTER COLUMN id SET DEFAULT nextval('public.command_items_id_seq'::regclass);


--
-- TOC entry 3318 (class 2604 OID 24617)
-- Name: commands id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commands ALTER COLUMN id SET DEFAULT nextval('public.commands_id_seq'::regclass);


--
-- TOC entry 3366 (class 2604 OID 57529)
-- Name: customer_orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_orders ALTER COLUMN id SET DEFAULT nextval('public.customer_orders_id_seq'::regclass);


--
-- TOC entry 3323 (class 2604 OID 24632)
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- TOC entry 3398 (class 2604 OID 73737)
-- Name: deliveries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deliveries ALTER COLUMN id SET DEFAULT nextval('public.deliveries_id_seq'::regclass);


--
-- TOC entry 3326 (class 2604 OID 24657)
-- Name: delivery_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_items ALTER COLUMN id SET DEFAULT nextval('public.delivery_items_id_seq'::regclass);


--
-- TOC entry 3374 (class 2604 OID 57545)
-- Name: dlc_products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.dlc_products ALTER COLUMN id SET DEFAULT nextval('public.dlc_products_id_seq'::regclass);


--
-- TOC entry 3346 (class 2604 OID 57454)
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- TOC entry 3328 (class 2604 OID 24680)
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- TOC entry 3351 (class 2604 OID 57467)
-- Name: nocodb_config id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nocodb_config ALTER COLUMN id SET DEFAULT nextval('public.nocodb_config_id_seq'::regclass);


--
-- TOC entry 3359 (class 2604 OID 57491)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 3393 (class 2604 OID 57584)
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- TOC entry 3363 (class 2604 OID 57516)
-- Name: publicities id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.publicities ALTER COLUMN id SET DEFAULT nextval('public.publicities_id_seq'::regclass);


--
-- TOC entry 3387 (class 2604 OID 57568)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 3333 (class 2604 OID 24695)
-- Name: sav_tickets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sav_tickets ALTER COLUMN id SET DEFAULT nextval('public.sav_tickets_id_seq'::regclass);


--
-- TOC entry 3338 (class 2604 OID 24710)
-- Name: stores id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stores ALTER COLUMN id SET DEFAULT nextval('public.stores_id_seq'::regclass);


--
-- TOC entry 3355 (class 2604 OID 57479)
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- TOC entry 3382 (class 2604 OID 57555)
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- TOC entry 3636 (class 0 OID 24577)
-- Dependencies: 216
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.calendar_events (id, title, description, user_id, store_id, start_date, end_date, is_all_day, type, metadata, created_at, updated_at) FROM stdin;
1	Réunion équipe mensuelle	Point mensuel sur les objectifs et nouveautés	1	1	2025-01-15 09:00:00	2025-01-15 10:30:00	f	meeting	\N	2025-07-10 10:43:36.498061	2025-07-10 10:43:36.498061
2	Formation sécurité	Formation obligatoire sécurité incendie	1	1	2025-01-18 14:00:00	2025-01-18 17:00:00	f	event	\N	2025-07-10 10:43:36.498061	2025-07-10 10:43:36.498061
3	Livraison importante	Réception commande mobilier salon	2	1	2025-01-15 14:00:00	2025-01-15 16:00:00	f	delivery	\N	2025-07-10 10:43:36.498061	2025-07-10 10:43:36.498061
4	Inventaire annuel	Inventaire complet du magasin	3	2	2025-01-25 08:00:00	2025-01-25 18:00:00	t	event	\N	2025-07-10 10:43:36.498061	2025-07-10 10:43:36.498061
5	Visite inspection	Visite du responsable régional	5	3	2025-01-22 10:00:00	2025-01-22 12:00:00	f	meeting	\N	2025-07-10 10:43:36.498061	2025-07-10 10:43:36.498061
6	Soldes d'hiver	Début des soldes d'hiver	1	1	2025-01-08 08:00:00	2025-02-04 20:00:00	t	event	\N	2025-07-10 10:43:36.498061	2025-07-10 10:43:36.498061
\.


--
-- TOC entry 3638 (class 0 OID 24590)
-- Dependencies: 218
-- Data for Name: client_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.client_orders (id, order_number, customer_id, store_id, user_id, status, total_amount, order_date, notes, created_at, updated_at) FROM stdin;
1	CLT-2025-001	1	1	2	processing	680.50	2025-01-08 14:30:00	Livraison prévue vendredi matin	2025-07-10 10:43:46.442279	2025-07-10 10:43:46.442279
2	CLT-2025-002	2	2	3	completed	1250.00	2025-01-05 10:15:00	Client satisfait de la livraison	2025-07-10 10:43:46.442279	2025-07-10 10:43:46.442279
3	CLT-2025-003	3	3	5	pending	890.75	2025-01-09 16:45:00	En attente de validation paiement	2025-07-10 10:43:46.442279	2025-07-10 10:43:46.442279
4	CLT-2025-004	4	1	2	cancelled	450.00	2025-01-07 11:20:00	Annulé par le client - remboursement effectué	2025-07-10 10:43:46.442279	2025-07-10 10:43:46.442279
5	CLT-2025-005	5	2	3	processing	1580.25	2025-01-09 09:30:00	Commande spéciale mobilier sur mesure	2025-07-10 10:43:46.442279	2025-07-10 10:43:46.442279
\.


--
-- TOC entry 3640 (class 0 OID 24605)
-- Dependencies: 220
-- Data for Name: command_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.command_items (id, command_id, product_name, product_code, quantity, unit_price, total_price, expiry_date) FROM stdin;
1	1	Canapé 3 places gris	MBL-CAP-001	2	450.00	900.00	\N
2	1	Table basse chêne	MBL-TBL-002	1	220.00	220.00	\N
3	1	Coussin décoratif	DEC-COU-003	6	21.67	130.00	\N
4	2	Vase céramique bleu	DEC-VAS-001	12	35.50	426.00	\N
5	2	Cadre photo 20x30	DEC-CAD-002	15	18.50	277.50	\N
6	2	Bougie parfumée	DEC-BOU-003	24	7.83	187.92	\N
7	3	Salon de jardin teck	JAR-SAL-001	1	1250.00	1250.00	\N
8	3	Parasol déporté 3m	JAR-PAR-002	2	285.50	571.00	\N
9	3	Coussins extérieur	JAR-COU-003	8	41.22	329.75	\N
10	4	Bureau informatique	BUR-INF-001	1	320.00	320.00	\N
11	4	Chaise ergonomique	BUR-CHA-002	2	123.90	247.80	\N
12	5	Tonnelle 3x4m	JAR-TON-001	1	890.00	890.00	\N
13	5	Plancha gaz	JAR-PLA-002	1	456.00	456.00	\N
14	5	Set outils jardinage	JAR-OUT-003	3	144.75	434.25	\N
\.


--
-- TOC entry 3642 (class 0 OID 24614)
-- Dependencies: 222
-- Data for Name: commands; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.commands (id, command_number, supplier_id, store_id, user_id, status, total_amount, notes, order_date, expected_delivery_date, created_at, updated_at) FROM stdin;
1	CMD-2025-001	1	1	1	pending	1250.50	Commande urgente pour réapprovisionnement	2025-07-10 10:29:05.575664	2025-07-17 10:29:05.575664	2025-07-10 10:29:05.575664	2025-07-10 10:29:05.575664
2	CMD-2025-002	2	1	1	validated	2100.75	Commande saisonnière hiver	2025-07-08 10:29:05.575664	2025-07-15 10:29:05.575664	2025-07-10 10:29:05.575664	2025-07-10 10:29:05.575664
3	CMD-2025-003	3	1	1	shipped	850.00	Mobilier jardin	2025-07-05 10:29:05.575664	2025-07-12 10:29:05.575664	2025-07-10 10:29:05.575664	2025-07-10 10:29:05.575664
7	CMD-2025-004	4	1	1	delivered	567.80	Mobilier bureau	2024-12-28 11:45:00	2025-01-03 10:00:00	2025-07-10 10:42:54.106019	2025-07-10 10:42:54.106019
8	CMD-2025-005	5	3	5	pending	1780.25	Collection jardin été	2025-01-09 16:10:00	2025-01-20 11:30:00	2025-07-10 10:42:54.106019	2025-07-10 10:42:54.106019
\.


--
-- TOC entry 3667 (class 0 OID 57526)
-- Dependencies: 247
-- Data for Name: customer_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customer_orders (id, order_taker, customer_name, customer_phone, customer_email, product_designation, product_reference, gencode, quantity, supplier_id, status, deposit, is_promotional_price, customer_notified, notes, group_id, created_by, created_at, updated_at) FROM stdin;
1	moi	schal	0623154654	\N	qsdfg	erf13213	3660092323745	1	1	En attente de Commande	10.00	f	f	\N	3	1	2025-07-19 19:03:44.739	2025-07-19 19:03:44.739
\.


--
-- TOC entry 3644 (class 0 OID 24629)
-- Dependencies: 224
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customers (id, first_name, last_name, email, phone, address, store_id, created_at, updated_at) FROM stdin;
1	Sophie	Dubois	sophie.dubois@email.com	06 12 34 56 78	10 Rue de la Paix, Paris	1	2025-07-10 10:29:05.575664	2025-07-10 10:29:05.575664
2	Marc	Legrand	marc.legrand@email.com	06 23 45 67 89	45 Avenue Montaigne, Paris	1	2025-07-10 10:29:05.575664	2025-07-10 10:29:05.575664
3	Julie	Moreau	julie.moreau@email.com	06 34 56 78 90	32 Boulevard Saint-Germain, Paris	1	2025-07-10 10:29:05.575664	2025-07-10 10:29:05.575664
4	Claire	Dubois	claire.dubois@email.com	06.12.34.56.78	45 Rue des Lilas, 75013 Paris	1	2025-07-10 10:43:03.624218	2025-07-10 10:43:03.624218
5	Michel	Rousseau	michel.rousseau@email.com	06.87.65.43.21	12 Avenue Victor Hugo, 92100 Boulogne	2	2025-07-10 10:43:03.624218	2025-07-10 10:43:03.624218
6	Isabelle	Moreau	isabelle.moreau@email.com	06.23.45.67.89	78 Boulevard Gambetta, 59800 Lille	3	2025-07-10 10:43:03.624218	2025-07-10 10:43:03.624218
7	Thomas	Leroy	thomas.leroy@email.com	06.98.76.54.32	33 Place de la République, 75003 Paris	1	2025-07-10 10:43:03.624218	2025-07-10 10:43:03.624218
8	Sandrine	Garcia	sandrine.garcia@email.com	06.11.22.33.44	67 Rue de la Liberté, 92000 Nanterre	2	2025-07-10 10:43:03.624218	2025-07-10 10:43:03.624218
\.


--
-- TOC entry 3682 (class 0 OID 819214)
-- Dependencies: 262
-- Data for Name: database_backups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.database_backups (id, filename, description, size, created_at, created_by, tables_count, status) FROM stdin;
backup_1753114666396_5bkylrjms	backup_1753114666396_5bkylrjms.sql	Test sauvegarde en production	0	2025-07-21 16:17:46.406606	admin	0	creating
backup_1753114731087_37sqhixni	backup_1753114731087_37sqhixni.sql	Test après correction répertoire	0	2025-07-21 16:18:51.096477	admin	0	creating
\.


--
-- TOC entry 3679 (class 0 OID 73734)
-- Dependencies: 259
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.deliveries (id, order_id, supplier_id, group_id, scheduled_date, delivered_date, quantity, unit, status, notes, bl_number, bl_amount, invoice_reference, invoice_amount, reconciled, validated_at, created_by, created_at, updated_at) FROM stdin;
1	\N	1	1	2025-07-20	\N	10	palettes	pending	Test livraison	\N	\N	\N	\N	f	\N	1	2025-07-19 20:32:20.382559	2025-07-19 20:32:20.382559
3	\N	1	4	2025-07-25	\N	5	palettes	planned	Test statut planned	\N	\N	\N	\N	f	\N	admin_local	2025-07-19 20:34:11.951608	2025-07-19 20:34:11.951608
2	1	1	4	2025-07-17	2025-07-19 20:33:34.611	1	palettes	delivered	\N	BL12345678	1299.00	faC454566435F	1299.00	t	2025-07-19 20:33:34.611	1	2025-07-19 20:33:27.154225	2025-07-19 21:50:36.00099
101	2	1	4	2025-07-26	\N	3	palettes	planned	Test pour validation - liée à commande ID 2	\N	\N	\N	\N	f	\N	admin_local	2025-07-20 08:22:00.758253	2025-07-20 08:22:00.758253
\.


--
-- TOC entry 3646 (class 0 OID 24654)
-- Dependencies: 226
-- Data for Name: delivery_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.delivery_items (id, delivery_id, command_item_id, product_name, quantity_ordered, quantity_delivered, quantity_damaged, notes) FROM stdin;
\.


--
-- TOC entry 3669 (class 0 OID 57542)
-- Dependencies: 249
-- Data for Name: dlc_products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.dlc_products (id, name, gencode, dlc_date, quantity, store_id, created_at, group_id, created_by, status, validated_by, expiry_date, product_code, description, supplier_id, product_name, date_type, unit, location, alert_threshold, notes, updated_at, validated_at) FROM stdin;
2	Produit Test DLC	1234567890123	2025-07-30	1	\N	2025-07-19 22:35:49.651214	4	admin_local	en_cours	\N	2025-07-30	1234567890123	\N	1	Produit Test DLC	DLC	unité	Magasin	15	Test stats	2025-07-19 22:35:49.651214	\N
3	Produit Expirant Bientôt	2345678901234	2025-07-22	2	\N	2025-07-19 22:35:49.651214	4	admin_local	en_cours	\N	2025-07-22	2345678901234	\N	1	Produit Expirant Bientôt	DLC	unité	Magasin	15	Expire dans 3 jours	2025-07-19 22:35:49.651214	\N
4	Produit Expiré	3456789012345	2025-07-15	1	\N	2025-07-19 22:35:49.651214	4	admin_local	en_cours	\N	2025-07-15	3456789012345	\N	1	Produit Expiré	DLC	unité	Magasin	15	Déjà expiré	2025-07-19 22:35:49.651214	\N
7	Produit Validé Test	VAL123	2025-08-15	1	\N	2025-07-19 23:54:00.380592	4	admin	valides	\N	\N	\N	\N	1	Produit Validé Test	DLC	unité	Magasin	15	Produit avec statut validé	2025-07-19 23:54:00.380592	\N
\.


--
-- TOC entry 3657 (class 0 OID 57451)
-- Dependencies: 237
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.groups (id, name, color, address, phone, email, nocodb_config_id, nocodb_table_id, nocodb_table_name, invoice_column_name, created_at, updated_at) FROM stdin;
4	Frouard	#1976D2	\N	\N	\N	\N			Ref Facture	2025-07-19 20:19:38.471557	2025-07-19 20:19:38.471557
5	Houdemont	#455A64	\N	\N	\N	\N			Ref Facture	2025-07-19 20:19:44.552373	2025-07-19 20:19:44.552373
\.


--
-- TOC entry 3648 (class 0 OID 24677)
-- Dependencies: 228
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.invoices (id, invoice_number, command_id, delivery_id, store_id, user_id, type, total_amount, status, issue_date, due_date, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3659 (class 0 OID 57464)
-- Dependencies: 239
-- Data for Name: nocodb_config; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.nocodb_config (id, name, base_url, project_id, api_token, description, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3663 (class 0 OID 57488)
-- Dependencies: 243
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, supplier_id, group_id, planned_date, quantity, unit, status, notes, created_by, created_at, updated_at) FROM stdin;
2	1	4	2025-07-09	\N	\N	pending	\N	1	2025-07-19 20:33:16.159959	2025-07-19 20:33:16.159959
1	1	3	2025-07-02	\N	\N	delivered	\N	1	2025-07-19 18:57:18.713694	2025-07-19 20:33:34.611
\.


--
-- TOC entry 3675 (class 0 OID 57581)
-- Dependencies: 255
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) FROM stdin;
24	dlc_read	Voir les DLC	\N	gestion_dlc	read	dlc	t	2025-07-19 18:59:09.594188
25	dlc_create	Créer des DLC	\N	gestion_dlc	create	dlc	t	2025-07-19 18:59:09.594188
26	dlc_update	Modifier des DLC	\N	gestion_dlc	update	dlc	t	2025-07-19 18:59:09.594188
27	dlc_delete	Supprimer des DLC	\N	gestion_dlc	delete	dlc	t	2025-07-19 18:59:09.594188
28	dlc_validate	Valider des DLC	\N	gestion_dlc	validate	dlc	t	2025-07-19 18:59:09.594188
29	dlc_print	Imprimer des DLC	\N	gestion_dlc	print	dlc	t	2025-07-19 18:59:09.594188
30	dlc_stats	Statistiques DLC	\N	gestion_dlc	stats	dlc	t	2025-07-19 18:59:09.594188
31	tasks_read	Voir les tâches	\N	gestion_taches	read	tasks	t	2025-07-19 18:59:11.571542
32	tasks_create	Créer des tâches	\N	gestion_taches	create	tasks	t	2025-07-19 18:59:11.571542
33	tasks_update	Modifier des tâches	\N	gestion_taches	update	tasks	t	2025-07-19 18:59:11.571542
34	tasks_delete	Supprimer des tâches	\N	gestion_taches	delete	tasks	t	2025-07-19 18:59:11.571542
35	tasks_assign	Assigner des tâches	\N	gestion_taches	assign	tasks	t	2025-07-19 18:59:11.571542
36	customer_orders_read	Voir les commandes clients	\N	commandes_clients	read	customer_orders	t	2025-07-19 18:59:13.610528
37	customer_orders_create	Créer des commandes clients	\N	commandes_clients	create	customer_orders	t	2025-07-19 18:59:13.610528
38	customer_orders_update	Modifier des commandes clients	\N	commandes_clients	update	customer_orders	t	2025-07-19 18:59:13.610528
39	customer_orders_delete	Supprimer des commandes clients	\N	commandes_clients	delete	customer_orders	t	2025-07-19 18:59:13.610528
40	customer_orders_print	Imprimer des commandes clients	\N	commandes_clients	print	customer_orders	t	2025-07-19 18:59:13.610528
41	system_admin	Administration système	\N	administration	admin	system	t	2025-07-19 18:59:14.717255
42	nocodb_config	Configuration NocoDB	\N	administration	config	nocodb	t	2025-07-19 18:59:14.717255
43	roles_read	Voir les rôles	\N	gestion_roles	read	roles	t	2025-07-19 18:59:16.624164
44	roles_create	Créer des rôles	\N	gestion_roles	create	roles	t	2025-07-19 18:59:16.624164
45	roles_update	Modifier des rôles	\N	gestion_roles	update	roles	t	2025-07-19 18:59:16.624164
46	roles_delete	Supprimer des rôles	\N	gestion_roles	delete	roles	t	2025-07-19 18:59:16.624164
47	permissions_assign	Assigner des permissions	\N	gestion_roles	assign	permissions	t	2025-07-19 18:59:16.624164
13	suppliers_delete	Supprimer des fournisseurs	\N	fournisseurs	delete	suppliers	t	2025-07-19 18:54:37.739625
22	publicities_read	Voir les publicités	\N	publicites	read	publicities	t	2025-07-19 18:54:37.739625
18	groups_read	Voir les magasins	\N	magasins	read	groups	t	2025-07-19 18:54:37.739625
19	groups_create	Créer des magasins	\N	magasins	create	groups	t	2025-07-19 18:54:37.739625
20	groups_update	Modifier des magasins	\N	magasins	update	groups	t	2025-07-19 18:54:37.739625
21	groups_delete	Supprimer des magasins	\N	magasins	delete	groups	t	2025-07-19 18:54:37.739625
23	publicities_create	Créer des publicités	\N	publicites	create	publicities	t	2025-07-19 18:54:37.739625
1	dashboard_read	Accéder au tableau de bord	\N	tableau_de_bord	read	dashboard	t	2025-07-19 18:54:37.739625
6	deliveries_read	Voir les livraisons	\N	livraisons	read	deliveries	t	2025-07-19 18:54:37.739625
7	deliveries_create	Créer des livraisons	\N	livraisons	create	deliveries	t	2025-07-19 18:54:37.739625
8	deliveries_update	Modifier des livraisons	\N	livraisons	update	deliveries	t	2025-07-19 18:54:37.739625
9	deliveries_delete	Supprimer des livraisons	\N	livraisons	delete	deliveries	t	2025-07-19 18:54:37.739625
10	suppliers_read	Voir les fournisseurs	\N	fournisseurs	read	suppliers	t	2025-07-19 18:54:37.739625
11	suppliers_create	Créer des fournisseurs	\N	fournisseurs	create	suppliers	t	2025-07-19 18:54:37.739625
12	suppliers_update	Modifier des fournisseurs	\N	fournisseurs	update	suppliers	t	2025-07-19 18:54:37.739625
14	users_read	Voir les utilisateurs	\N	utilisateurs	read	users	t	2025-07-19 18:54:37.739625
15	users_create	Créer des utilisateurs	\N	utilisateurs	create	users	t	2025-07-19 18:54:37.739625
16	users_update	Modifier des utilisateurs	\N	utilisateurs	update	users	t	2025-07-19 18:54:37.739625
17	users_delete	Supprimer des utilisateurs	\N	utilisateurs	delete	users	t	2025-07-19 18:54:37.739625
48	publicities_update	Modifier des publicités	\N	publicites	update	publicities	t	2025-07-19 18:59:34.066683
49	publicities_delete	Supprimer des publicités	\N	publicites	delete	publicities	t	2025-07-19 18:59:34.066683
50	publicities_participate	Gérer la participation	\N	publicites	participate	publicities	t	2025-07-19 18:59:34.066683
51	statistics_read	Voir les statistiques	\N	tableau_de_bord	read	statistics	t	2025-07-19 19:00:12.356057
2	orders_read	Voir les commandes	\N	commandes	read	orders	t	2025-07-19 18:54:37.739625
3	orders_create	Créer des commandes	\N	commandes	create	orders	t	2025-07-19 18:54:37.739625
4	orders_update	Modifier des commandes	\N	commandes	update	orders	t	2025-07-19 18:54:37.739625
5	orders_delete	Supprimer des commandes	\N	commandes	delete	orders	t	2025-07-19 18:54:37.739625
52	reports_generate	Générer des rapports	\N	tableau_de_bord	generate	reports	t	2025-07-19 19:00:12.356057
53	backup_create	Créer des sauvegardes	\N	administration	backup	system	t	2025-07-19 19:00:12.356057
54	logs_read	Consulter les logs	\N	administration	read	logs	t	2025-07-19 19:00:12.356057
\.


--
-- TOC entry 3665 (class 0 OID 57513)
-- Dependencies: 245
-- Data for Name: publicities; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.publicities (id, pub_number, designation, title, description, start_date, end_date, year, created_by, created_at, updated_at) FROM stdin;
3	TEST-PROD	Test Production	\N	\N	2025-07-22	2025-07-28	2025	1	2025-07-19 22:38:52.143069	2025-07-19 22:38:52.143069
4	TEST-FORCE-PROD	Test Force Production	\N	\N	2025-07-23	2025-07-29	2025	1	2025-07-19 22:39:13.937601	2025-07-19 22:39:13.937601
5	TEST-ERROR	Test Error	\N	\N	2025-07-24	2025-07-30	2025	1	2025-07-19 22:54:05.573607	2025-07-19 22:54:05.573607
6	2501	wxcvwxc	\N	\N	2025-07-01	2025-07-06	2025	1	2025-07-19 22:55:06.907432	2025-07-19 22:55:06.907432
7	DEBUG-PROD	Debug Production	\N	\N	2025-07-25	2025-07-31	2025	1	2025-07-19 22:56:05.296286	2025-07-19 22:56:05.296286
9	FINAL-TEST	Test Final Production	\N	\N	2025-07-27	2025-08-02	2025	1	2025-07-19 23:03:21.499342	2025-07-19 23:03:21.499342
8	DIAG-PROD	Diagnostic Production	\N	\N	2025-07-26	2025-08-01	2025	1	2025-07-19 22:58:31.680917	2025-07-20 09:09:26.486
2	TEST123	Test	\N	\N	2025-07-20	2025-07-25	2025	1	2025-07-19 22:38:10.039397	2025-07-20 09:13:42.375
\.


--
-- TOC entry 3677 (class 0 OID 57615)
-- Dependencies: 257
-- Data for Name: publicity_participations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.publicity_participations (publicity_id, group_id, created_at) FROM stdin;
1	5	2025-07-19 21:38:15.036215
3	4	2025-07-19 22:38:52.193439
4	4	2025-07-19 22:39:13.987098
5	4	2025-07-19 22:54:05.624748
6	5	2025-07-19 22:55:06.955089
7	4	2025-07-19 22:56:05.344704
9	5	2025-07-19 23:03:21.551156
2	4	2025-07-20 09:13:42.436078
2	5	2025-07-20 09:13:42.436078
\.


--
-- TOC entry 3676 (class 0 OID 57609)
-- Dependencies: 256
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.role_permissions (role_id, permission_id, created_at) FROM stdin;
3	22	2025-07-20 09:05:10.650992
3	1	2025-07-20 09:15:38.143569
3	51	2025-07-20 09:15:38.143569
3	52	2025-07-20 09:15:38.143569
3	10	2025-07-20 09:23:23.488227
3	13	2025-07-20 10:04:54.91253
3	11	2025-07-20 10:04:54.91253
3	12	2025-07-20 10:04:54.91253
3	14	2025-07-20 10:21:39.143947
3	45	2025-07-20 10:22:01.504817
3	23	2025-07-20 10:22:20.614368
3	16	2025-07-20 10:22:20.614368
3	49	2025-07-20 10:22:20.614368
3	28	2025-07-20 10:22:20.614368
3	48	2025-07-20 10:22:20.614368
3	41	2025-07-20 10:22:20.614368
3	42	2025-07-20 10:22:20.614368
3	15	2025-07-20 10:22:20.614368
3	21	2025-07-20 10:22:20.614368
3	19	2025-07-20 10:22:20.614368
3	20	2025-07-20 10:22:20.614368
3	17	2025-07-20 10:22:20.614368
3	18	2025-07-20 10:22:20.614368
3	31	2025-07-20 11:03:38.223553
3	32	2025-07-20 11:03:38.223553
3	33	2025-07-20 11:03:38.223553
3	34	2025-07-20 11:03:38.223553
3	35	2025-07-20 11:03:38.223553
2	24	2025-07-20 11:32:33.750046
2	25	2025-07-20 11:32:33.750046
2	26	2025-07-20 11:32:33.750046
2	27	2025-07-20 11:32:33.750046
2	28	2025-07-20 11:32:33.750046
2	29	2025-07-20 11:32:33.750046
2	31	2025-07-20 11:32:33.750046
2	32	2025-07-20 11:32:33.750046
2	33	2025-07-20 11:32:33.750046
2	34	2025-07-20 11:32:33.750046
2	35	2025-07-20 11:32:33.750046
2	36	2025-07-20 11:32:33.750046
2	37	2025-07-20 11:32:33.750046
2	38	2025-07-20 11:32:33.750046
2	39	2025-07-20 11:32:33.750046
2	40	2025-07-20 11:32:33.750046
2	13	2025-07-20 11:32:33.750046
2	22	2025-07-20 11:32:33.750046
2	23	2025-07-20 11:32:33.750046
2	1	2025-07-20 11:32:33.750046
2	6	2025-07-20 11:32:33.750046
2	7	2025-07-20 11:32:33.750046
2	8	2025-07-20 11:32:33.750046
2	9	2025-07-20 11:32:33.750046
2	10	2025-07-20 11:32:33.750046
2	11	2025-07-20 11:32:33.750046
2	12	2025-07-20 11:32:33.750046
2	14	2025-07-20 11:32:33.750046
2	48	2025-07-20 11:32:33.750046
2	49	2025-07-20 11:32:33.750046
2	51	2025-07-20 11:32:33.750046
2	2	2025-07-20 11:32:33.750046
2	3	2025-07-20 11:32:33.750046
2	4	2025-07-20 11:32:33.750046
2	5	2025-07-20 11:32:33.750046
2	52	2025-07-20 11:32:33.750046
1	1	2025-07-19 20:15:44.752
1	2	2025-07-19 20:15:44.752
1	3	2025-07-19 20:15:44.752
1	4	2025-07-19 20:15:44.752
1	5	2025-07-19 20:15:44.752
1	6	2025-07-19 20:15:44.752
1	7	2025-07-19 20:15:44.752
1	8	2025-07-19 20:15:44.752
1	9	2025-07-19 20:15:44.752
1	10	2025-07-19 20:15:44.752
1	11	2025-07-19 20:15:44.752
1	12	2025-07-19 20:15:44.752
1	13	2025-07-19 20:15:44.752
1	14	2025-07-19 20:15:44.752
1	15	2025-07-19 20:15:44.752
1	16	2025-07-19 20:15:44.752
1	17	2025-07-19 20:15:44.752
1	18	2025-07-19 20:15:44.752
1	19	2025-07-19 20:15:44.752
1	20	2025-07-19 20:15:44.752
1	21	2025-07-19 20:15:44.752
1	22	2025-07-19 20:15:44.752
1	23	2025-07-19 20:15:44.752
1	24	2025-07-19 20:15:44.752
1	25	2025-07-19 20:15:44.752
1	26	2025-07-19 20:15:44.752
1	27	2025-07-19 20:15:44.752
1	28	2025-07-19 20:15:44.752
1	29	2025-07-19 20:15:44.752
1	30	2025-07-19 20:15:44.752
1	31	2025-07-19 20:15:44.752
1	32	2025-07-19 20:15:44.752
1	33	2025-07-19 20:15:44.752
1	34	2025-07-19 20:15:44.752
1	35	2025-07-19 20:15:44.752
1	36	2025-07-19 20:15:44.752
1	37	2025-07-19 20:15:44.752
1	38	2025-07-19 20:15:44.752
1	39	2025-07-19 20:15:44.752
1	40	2025-07-19 20:15:44.752
1	41	2025-07-19 20:15:44.752
1	42	2025-07-19 20:15:44.752
1	43	2025-07-19 20:15:44.752
1	44	2025-07-19 20:15:44.752
1	45	2025-07-19 20:15:44.752
1	46	2025-07-19 20:15:44.752
1	47	2025-07-19 20:15:44.752
1	48	2025-07-19 20:15:44.752
1	49	2025-07-19 20:15:44.752
1	50	2025-07-19 20:15:44.752
1	51	2025-07-19 20:15:44.752
1	52	2025-07-19 20:15:44.752
1	54	2025-07-19 20:15:44.752
1	53	2025-07-19 20:15:44.752
\.


--
-- TOC entry 3673 (class 0 OID 57565)
-- Dependencies: 253
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, display_name, description, color, is_system, is_active, created_at, updated_at) FROM stdin;
2	manager	Manager	Gestion des opérations	#6b7280	f	t	2025-07-19 18:54:37.714268	2025-07-19 18:54:37.714268
3	employee	Employé	Accès de base	#6b7280	f	t	2025-07-19 18:54:37.714268	2025-07-19 18:54:37.714268
1	admin	Administrateur	Accès complet au système	#d2b72d	f	t	2025-07-19 18:54:37.714268	2025-07-19 19:03:17.457
\.


--
-- TOC entry 3650 (class 0 OID 24692)
-- Dependencies: 230
-- Data for Name: sav_tickets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sav_tickets (id, ticket_number, customer_id, store_id, user_id, assigned_user_id, title, description, status, priority, category, resolution, created_at, updated_at) FROM stdin;
1	SAV-2025-001	1	1	1	\N	Produit défaillant	Le client signale un défaut sur son achat de la semaine dernière	open	high	warranty	\N	2025-07-10 10:29:11.446002	2025-07-10 10:29:11.446002
2	SAV-2025-002	2	1	1	\N	Demande d'échange	Le client souhaite échanger un article contre un autre modèle	in_progress	normal	exchange	\N	2025-07-10 10:29:11.446002	2025-07-10 10:29:11.446002
3	SAV-2025-003	3	1	1	\N	Retour produit	Retour sous garantie pour remboursement	open	normal	return	\N	2025-07-10 10:29:11.446002	2025-07-10 10:29:11.446002
7	SAV-2025-004	4	1	1	2	Garantie parasol	Mécanisme d'ouverture cassé après 3 mois. Sous garantie.	resolved	normal	warranty	\N	2025-07-10 10:43:42.222233	2025-07-10 10:43:42.222233
8	SAV-2025-005	5	2	3	3	Pièce manquante	Vis de fixation manquantes dans le colis mobilier bureau.	open	low	complaint	\N	2025-07-10 10:43:42.222233	2025-07-10 10:43:42.222233
\.


--
-- TOC entry 3653 (class 0 OID 32770)
-- Dependencies: 233
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
5AAjNqk_bk4pUqGV_89wBT0Eh1umaB1i	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-22T16:10:23.592Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"1"}}	2025-07-22 16:15:01
qNVPnJK4qf6TstLrb4M2_QkEVwJJ5Ds_	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-21T15:20:22.015Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"100"}}	2025-07-21 15:20:23
LMpukTV-U3Pro7Ypa0vSKoOw-w5eYZTK	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-22T13:52:37.325Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"1"}}	2025-07-22 15:47:01
rvDZV_jlEj_vmNTsF3-ijKg4MXDGkJmm	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-21T15:21:10.911Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"100"}}	2025-07-21 15:21:14
IcPTH3HJJigx50husDndewH93TJItM3N	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-21T15:31:49.546Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"100"}}	2025-07-21 15:31:51
K0p9ZRf2phBo-VTfJnQlVNYxl1hctemE	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-22T16:12:41.769Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"1"}}	2025-07-22 16:18:01
r5QhTdpSLcJjE5dK2wpPJ1V9wVNQ0XVJ	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-22T16:17:45.322Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"1"}}	2025-07-22 16:18:52
cnrsW5Gh8Er73HnEdFMzzOfPuny8t_qf	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-21T15:13:44.012Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"100"}}	2025-07-21 15:14:18
m5LspxbruWlXhr_FvVS4x3kij1JVA2yK	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-21T15:32:17.417Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"100"}}	2025-07-21 15:32:19
3fl4bV6PVYUwWL1L7_SxzIym30bBt3e8	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-21T15:15:15.478Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"100"}}	2025-07-21 15:15:18
y2787Su4YF4UMEpQcICz_rWSS6i9WHzh	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-21T15:55:04.777Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"100"}}	2025-07-22 06:34:42
77-quEj4EjMnKv7HpbP5NRoU7CJo58re	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-21T15:48:01.628Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"100"}}	2025-07-21 15:48:02
87klsFoiche-m5bT9J-69whKDXUs79rM	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-21T15:48:18.732Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"100"}}	2025-07-21 15:48:20
igwWGzdcKz-O4AemNQwN4lPnc4fVmowy	{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-21T15:02:27.225Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":"1"}}	2025-07-21 15:02:28
\.


--
-- TOC entry 3654 (class 0 OID 57427)
-- Dependencies: 234
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- TOC entry 3652 (class 0 OID 24707)
-- Dependencies: 232
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stores (id, name, address, phone, email, is_active, created_at, updated_at) FROM stdin;
1	La Foir'Fouille Paris	123 Avenue des Champs-Élysées, Paris	01 42 12 34 56	paris@lafoirfouille.com	t	2025-07-10 10:28:59.788159	2025-07-10 10:28:59.788159
2	La Foir'Fouille Centre-Ville	123 Rue de la Paix, 75001 Paris	01.23.45.67.89	centre-ville@lafoir.com	t	2025-07-10 10:42:33.03728	2025-07-10 10:42:33.03728
3	La Foir'Fouille Banlieue	456 Avenue des Champs, 92000 Nanterre	01.98.76.54.32	banlieue@lafoir.com	t	2025-07-10 10:42:33.03728	2025-07-10 10:42:33.03728
4	La Foir'Fouille Nord	789 Boulevard du Nord, 59000 Lille	01.11.22.33.44	nord@lafoir.com	t	2025-07-10 10:42:33.03728	2025-07-10 10:42:33.03728
5	Frouard				t	2025-07-10 11:47:14.665546	2025-07-10 11:47:14.665546
\.


--
-- TOC entry 3661 (class 0 OID 57476)
-- Dependencies: 241
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) FROM stdin;
2	Fournisseur Test 2	Marie Martin	01 98 76 54 32	f	2025-07-19 18:54:37.690583	2025-07-19 18:54:37.690583
1	Fournisseur Test 1	Jean Dupont	01 23 45 67 89	t	2025-07-19 18:54:37.690583	2025-07-19 22:12:13.102179
3	Fournisseur DLC Test	Pierre Dubois	06 12 34 56 78	t	2025-07-20 10:26:02.261353	2025-07-20 10:26:02.261353
\.


--
-- TOC entry 3671 (class 0 OID 57552)
-- Dependencies: 251
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tasks (id, title, description, assigned_to, due_date, priority, status, store_id, created_at, updated_at, created_by, group_id, completed_at, completed_by) FROM stdin;
3	wdsfvs	dffdsf	sdf	2025-07-19	medium	pending	\N	2025-07-19 22:54:05.102086	2025-07-19 22:54:05.102086	1	4	\N	\N
5	qsdqs	sqdqsd	qsd	2025-07-19	medium	pending	\N	2025-07-19 23:24:32.108861	2025-07-19 23:24:32.108861	1	4	\N	\N
6	qqsdq	sqd	qsdqs	2025-07-19	medium	pending	\N	2025-07-19 23:24:38.618689	2025-07-19 23:24:38.618689	1	4	\N	\N
9	qsdqsd	qsdq		2025-07-19	medium	pending	\N	2025-07-19 23:25:05.921267	2025-07-19 23:25:05.921267	1	4	\N	\N
10	qsdqsd	qsdqsd		2025-07-19	medium	pending	\N	2025-07-19 23:25:09.829013	2025-07-19 23:25:09.829013	1	4	\N	\N
11	qsdqsd	qsdqsd		2025-07-19	medium	pending	\N	2025-07-19 23:25:13.912904	2025-07-19 23:25:13.912904	1	4	\N	\N
12	qsdf	dsfq	qsdf	2025-07-19	medium	pending	\N	2025-07-19 23:35:06.345706	2025-07-19 23:35:06.345706	1	4	\N	\N
13	qsdfsq	dsqdf	qsdfq	2025-07-19	medium	pending	\N	2025-07-19 23:35:10.818222	2025-07-19 23:35:10.818222	1	4	\N	\N
14	qdfqs	dfqsdf		2025-07-19	medium	pending	\N	2025-07-19 23:35:15.309994	2025-07-19 23:35:15.309994	1	4	\N	\N
15	qsdf	sqdfqs	qsdfqs	2025-07-19	medium	pending	\N	2025-07-19 23:35:22.302827	2025-07-19 23:35:22.302827	1	4	\N	\N
16	qsdfsqdf	sqdfqs		2025-07-19	medium	pending	\N	2025-07-19 23:35:31.136433	2025-07-19 23:35:31.136433	1	4	\N	\N
\.


--
-- TOC entry 3681 (class 0 OID 720923)
-- Dependencies: 261
-- Data for Name: user_groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_groups (user_id, group_id, assigned_by, assigned_at) FROM stdin;
\.


--
-- TOC entry 3680 (class 0 OID 720910)
-- Dependencies: 260
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_roles (user_id, role_id, assigned_by, assigned_at) FROM stdin;
_1753102038583	1	role_migration	2025-07-21 13:18:41.543897
1	1	migration_urgente	2025-07-21 13:36:39.894766
\.


--
-- TOC entry 3655 (class 0 OID 57435)
-- Dependencies: 235
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, email, name, first_name, last_name, profile_image_url, password, role, password_changed, created_at, updated_at) FROM stdin;
test_manager	manager_test	manager@logiflow.com	Manager Test	Manager	Test	\N	26e499453d0a570033917b4f172d292c3e0f69132e9c3861d4a61e24d09368bb4b8520b9333dd7f62d8f6d775e5d543111d629b0fcaa1b712df413752a5ed0fb.535952a042562679421200f1e665f47a	manager	t	2025-07-20 11:37:19.374446	2025-07-20 11:37:19.374446
_1753102038583	directeur	directeur@logiflow.com	Test Directeur	Test	Directeur	\N	169913cc700a6062a0a33a6f2d0b5553313a5115d875c9003ff4849331a102c08052ac76f194d48ee643d2ee9177cb9d5fb74f461776da5207ab7f8411029652.8f029c10c34b0f08cd598015e331b3ce	admin	t	2025-07-20 11:58:58.314155	2025-07-20 12:24:09.953
101	test_user	test@logiflow.com	Test User	Test	User	\N	589bf3c4899405171f173a345c9d6b16:8119cf13a75a41985e1832bd48a543c65ec7142e5f13cb0cf86c9b96b9e5d42d	test_role	f	2025-07-20 12:00:34.590954	2025-07-20 12:00:34.590954
_1753001006996	ff292	ff292@logiflow.com	ff292	Employee	Frouard	\N	ff292	employee	t	2025-07-20 08:43:27.733	2025-07-20 08:56:54.66
1	admin	admin@logiflow.com	Admin System	Michael	SCHAL	\N	ac6289eada17390df56028f5032e201dbb7bca36c48054e84870ca9fe966437baae2db9e26cd04f5c01ebf488f6bf37b7fc6442d77daec56d1ffd1f4ea329d43.dea71bff01edb7757ea726ee2a97a8f4	admin	f	2025-07-19 18:54:37.64216	2025-07-21 16:17:53.279
\.


--
-- TOC entry 3710 (class 0 OID 0)
-- Dependencies: 215
-- Name: calendar_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.calendar_events_id_seq', 6, true);


--
-- TOC entry 3711 (class 0 OID 0)
-- Dependencies: 217
-- Name: client_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.client_orders_id_seq', 5, true);


--
-- TOC entry 3712 (class 0 OID 0)
-- Dependencies: 219
-- Name: command_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.command_items_id_seq', 14, true);


--
-- TOC entry 3713 (class 0 OID 0)
-- Dependencies: 221
-- Name: commands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.commands_id_seq', 8, true);


--
-- TOC entry 3714 (class 0 OID 0)
-- Dependencies: 246
-- Name: customer_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customer_orders_id_seq', 1, true);


--
-- TOC entry 3715 (class 0 OID 0)
-- Dependencies: 223
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customers_id_seq', 8, true);


--
-- TOC entry 3716 (class 0 OID 0)
-- Dependencies: 258
-- Name: deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.deliveries_id_seq', 101, true);


--
-- TOC entry 3717 (class 0 OID 0)
-- Dependencies: 225
-- Name: delivery_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.delivery_items_id_seq', 1, false);


--
-- TOC entry 3718 (class 0 OID 0)
-- Dependencies: 248
-- Name: dlc_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.dlc_products_id_seq', 7, true);


--
-- TOC entry 3719 (class 0 OID 0)
-- Dependencies: 236
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.groups_id_seq', 5, true);


--
-- TOC entry 3720 (class 0 OID 0)
-- Dependencies: 227
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, false);


--
-- TOC entry 3721 (class 0 OID 0)
-- Dependencies: 238
-- Name: nocodb_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.nocodb_config_id_seq', 1, false);


--
-- TOC entry 3722 (class 0 OID 0)
-- Dependencies: 242
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.orders_id_seq', 2, true);


--
-- TOC entry 3723 (class 0 OID 0)
-- Dependencies: 254
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.permissions_id_seq', 54, true);


--
-- TOC entry 3724 (class 0 OID 0)
-- Dependencies: 244
-- Name: publicities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.publicities_id_seq', 9, true);


--
-- TOC entry 3725 (class 0 OID 0)
-- Dependencies: 252
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- TOC entry 3726 (class 0 OID 0)
-- Dependencies: 229
-- Name: sav_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sav_tickets_id_seq', 8, true);


--
-- TOC entry 3727 (class 0 OID 0)
-- Dependencies: 231
-- Name: stores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stores_id_seq', 5, true);


--
-- TOC entry 3728 (class 0 OID 0)
-- Dependencies: 240
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 3, true);


--
-- TOC entry 3729 (class 0 OID 0)
-- Dependencies: 250
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tasks_id_seq', 16, true);


--
-- TOC entry 3412 (class 2606 OID 24588)
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- TOC entry 3414 (class 2606 OID 24603)
-- Name: client_orders client_orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_orders
    ADD CONSTRAINT client_orders_order_number_unique UNIQUE (order_number);


--
-- TOC entry 3416 (class 2606 OID 24601)
-- Name: client_orders client_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.client_orders
    ADD CONSTRAINT client_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3418 (class 2606 OID 24612)
-- Name: command_items command_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.command_items
    ADD CONSTRAINT command_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3420 (class 2606 OID 24627)
-- Name: commands commands_command_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commands
    ADD CONSTRAINT commands_command_number_unique UNIQUE (command_number);


--
-- TOC entry 3422 (class 2606 OID 24625)
-- Name: commands commands_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.commands
    ADD CONSTRAINT commands_pkey PRIMARY KEY (id);


--
-- TOC entry 3461 (class 2606 OID 57540)
-- Name: customer_orders customer_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_orders
    ADD CONSTRAINT customer_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3424 (class 2606 OID 24638)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 3488 (class 2606 OID 819224)
-- Name: database_backups database_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.database_backups
    ADD CONSTRAINT database_backups_pkey PRIMARY KEY (id);


--
-- TOC entry 3479 (class 2606 OID 73746)
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- TOC entry 3426 (class 2606 OID 24662)
-- Name: delivery_items delivery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.delivery_items
    ADD CONSTRAINT delivery_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3463 (class 2606 OID 57550)
-- Name: dlc_products dlc_products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.dlc_products
    ADD CONSTRAINT dlc_products_pkey PRIMARY KEY (id);


--
-- TOC entry 3449 (class 2606 OID 57462)
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3428 (class 2606 OID 24690)
-- Name: invoices invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- TOC entry 3430 (class 2606 OID 24688)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 3451 (class 2606 OID 57474)
-- Name: nocodb_config nocodb_config_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.nocodb_config
    ADD CONSTRAINT nocodb_config_pkey PRIMARY KEY (id);


--
-- TOC entry 3455 (class 2606 OID 57498)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3471 (class 2606 OID 57592)
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- TOC entry 3473 (class 2606 OID 57590)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3457 (class 2606 OID 57522)
-- Name: publicities publicities_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.publicities
    ADD CONSTRAINT publicities_pkey PRIMARY KEY (id);


--
-- TOC entry 3459 (class 2606 OID 57524)
-- Name: publicities publicities_pub_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.publicities
    ADD CONSTRAINT publicities_pub_number_key UNIQUE (pub_number);


--
-- TOC entry 3477 (class 2606 OID 57620)
-- Name: publicity_participations publicity_participations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.publicity_participations
    ADD CONSTRAINT publicity_participations_pkey PRIMARY KEY (publicity_id, group_id);


--
-- TOC entry 3475 (class 2606 OID 57614)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 3467 (class 2606 OID 57579)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 3469 (class 2606 OID 57577)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3432 (class 2606 OID 24703)
-- Name: sav_tickets sav_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sav_tickets
    ADD CONSTRAINT sav_tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 3434 (class 2606 OID 24705)
-- Name: sav_tickets sav_tickets_ticket_number_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sav_tickets
    ADD CONSTRAINT sav_tickets_ticket_number_unique UNIQUE (ticket_number);


--
-- TOC entry 3439 (class 2606 OID 32776)
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- TOC entry 3442 (class 2606 OID 57433)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- TOC entry 3436 (class 2606 OID 24717)
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- TOC entry 3453 (class 2606 OID 57486)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 3465 (class 2606 OID 57563)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3486 (class 2606 OID 720930)
-- Name: user_groups user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_pkey PRIMARY KEY (user_id, group_id);


--
-- TOC entry 3484 (class 2606 OID 720917)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- TOC entry 3445 (class 2606 OID 57445)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3447 (class 2606 OID 57447)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3437 (class 1259 OID 32777)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- TOC entry 3440 (class 1259 OID 57434)
-- Name: idx_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_expire ON public.sessions USING btree (expire);


--
-- TOC entry 3480 (class 1259 OID 720946)
-- Name: idx_user_roles_assigned_by; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_roles_assigned_by ON public.user_roles USING btree (assigned_by);


--
-- TOC entry 3481 (class 1259 OID 720945)
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- TOC entry 3482 (class 1259 OID 720944)
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- TOC entry 3443 (class 1259 OID 319488)
-- Name: users_email_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX users_email_unique ON public.users USING btree (email) WHERE (email IS NOT NULL);


--
-- TOC entry 3489 (class 2606 OID 851969)
-- Name: tasks tasks_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3491 (class 2606 OID 720931)
-- Name: user_groups user_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3490 (class 2606 OID 720918)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 3689 (class 0 OID 0)
-- Dependencies: 3688
-- Name: DATABASE neondb; Type: ACL; Schema: -; Owner: neondb_owner
--

GRANT ALL ON DATABASE neondb TO neon_superuser;


--
-- TOC entry 2166 (class 826 OID 16392)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2165 (class 826 OID 16391)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2025-07-21 16:18:54 UTC

--
-- PostgreSQL database dump complete
--

