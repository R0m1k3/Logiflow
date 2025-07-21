--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 17.5

-- Started on 2025-07-21 19:57:51 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS logiflow_db;
--
-- TOC entry 3658 (class 1262 OID 16384)
-- Name: logiflow_db; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE logiflow_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


\connect logiflow_db

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- TOC entry 236 (class 1259 OID 24792)
-- Name: customer_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_orders (
    id integer NOT NULL,
    order_taker character varying(255) NOT NULL,
    customer_name character varying(255) NOT NULL,
    customer_phone character varying(255),
    customer_email character varying(255),
    product_designation text NOT NULL,
    product_reference character varying(255),
    gencode character varying(255),
    quantity integer DEFAULT 1,
    supplier_id integer,
    status character varying(100) DEFAULT 'En attente de Commande'::character varying,
    deposit numeric(10,2) DEFAULT 0.00,
    is_promotional_price boolean DEFAULT false,
    customer_notified boolean DEFAULT false,
    notes text,
    group_id integer,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 235 (class 1259 OID 24791)
-- Name: customer_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3659 (class 0 OID 0)
-- Dependencies: 235
-- Name: customer_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_orders_id_seq OWNED BY public.customer_orders.id;


--
-- TOC entry 242 (class 1259 OID 24922)
-- Name: database_backups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.database_backups (
    id character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    description text,
    size bigint DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    tables_count integer DEFAULT 0,
    status character varying(50) DEFAULT 'creating'::character varying,
    backup_type character varying(10) DEFAULT 'manual'::character varying
);


--
-- TOC entry 222 (class 1259 OID 24644)
-- Name: deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deliveries (
    id integer NOT NULL,
    order_id integer,
    supplier_id integer,
    group_id integer,
    scheduled_date date NOT NULL,
    delivered_date timestamp without time zone,
    quantity integer NOT NULL,
    unit character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    notes text,
    bl_number character varying(255),
    bl_amount numeric(10,2),
    invoice_reference character varying(255),
    invoice_amount numeric(10,2),
    reconciled boolean DEFAULT false,
    validated_at timestamp without time zone,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT deliveries_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'planned'::character varying, 'delivered'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- TOC entry 221 (class 1259 OID 24643)
-- Name: deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3660 (class 0 OID 0)
-- Dependencies: 221
-- Name: deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.deliveries_id_seq OWNED BY public.deliveries.id;


--
-- TOC entry 238 (class 1259 OID 24823)
-- Name: dlc_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dlc_products (
    id integer NOT NULL,
    product_name character varying(255) NOT NULL,
    expiry_date date NOT NULL,
    date_type character varying(50) DEFAULT 'DLC'::character varying NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit character varying(50) DEFAULT 'unité'::character varying NOT NULL,
    supplier_id integer NOT NULL,
    location character varying(255) DEFAULT 'Magasin'::character varying NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    notes text,
    alert_threshold integer DEFAULT 15 NOT NULL,
    validated_at timestamp without time zone,
    validated_by character varying(255),
    group_id integer NOT NULL,
    created_by character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    gencode character varying(255),
    name character varying(255),
    dlc_date date,
    product_code character varying(255),
    description text
);


--
-- TOC entry 237 (class 1259 OID 24822)
-- Name: dlc_products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dlc_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3661 (class 0 OID 0)
-- Dependencies: 237
-- Name: dlc_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dlc_products_id_seq OWNED BY public.dlc_products.id;


--
-- TOC entry 216 (class 1259 OID 24592)
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(20) DEFAULT '#1976D2'::character varying,
    nocodb_config_id integer,
    nocodb_table_id character varying(255),
    nocodb_table_name character varying(255),
    invoice_column_name character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 215 (class 1259 OID 24591)
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3662 (class 0 OID 0)
-- Dependencies: 215
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- TOC entry 234 (class 1259 OID 24775)
-- Name: nocodb_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nocodb_config (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    base_url character varying(255) NOT NULL,
    project_id character varying(255) NOT NULL,
    api_token character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 233 (class 1259 OID 24774)
-- Name: nocodb_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nocodb_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3663 (class 0 OID 0)
-- Dependencies: 233
-- Name: nocodb_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nocodb_config_id_seq OWNED BY public.nocodb_config.id;


--
-- TOC entry 220 (class 1259 OID 24616)
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    supplier_id integer,
    group_id integer,
    planned_date date NOT NULL,
    quantity integer,
    unit character varying(50),
    status character varying(50) DEFAULT 'pending'::character varying,
    notes text,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'planned'::character varying, 'delivered'::character varying])::text[])))
);


--
-- TOC entry 219 (class 1259 OID 24615)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3664 (class 0 OID 0)
-- Dependencies: 219
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 231 (class 1259 OID 24747)
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    category character varying(255) NOT NULL,
    action character varying(255) NOT NULL,
    resource character varying(255) NOT NULL,
    is_system boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 230 (class 1259 OID 24746)
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3665 (class 0 OID 0)
-- Dependencies: 230
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- TOC entry 226 (class 1259 OID 24700)
-- Name: publicities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publicities (
    id integer NOT NULL,
    pub_number character varying(255) NOT NULL,
    designation text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    year integer NOT NULL,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 225 (class 1259 OID 24699)
-- Name: publicities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.publicities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3666 (class 0 OID 0)
-- Dependencies: 225
-- Name: publicities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.publicities_id_seq OWNED BY public.publicities.id;


--
-- TOC entry 227 (class 1259 OID 24715)
-- Name: publicity_participations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publicity_participations (
    publicity_id integer NOT NULL,
    group_id integer NOT NULL
);


--
-- TOC entry 232 (class 1259 OID 24759)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 24731)
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    color character varying(7) DEFAULT '#6b7280'::character varying,
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 228 (class 1259 OID 24730)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3667 (class 0 OID 0)
-- Dependencies: 228
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- TOC entry 224 (class 1259 OID 24692)
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- TOC entry 218 (class 1259 OID 24604)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    contact character varying(255),
    phone character varying(255),
    has_dlc boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 217 (class 1259 OID 24603)
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3668 (class 0 OID 0)
-- Dependencies: 217
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- TOC entry 240 (class 1259 OID 24860)
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    priority character varying(50) DEFAULT 'medium'::character varying NOT NULL,
    assigned_to character varying(255),
    due_date date,
    group_id integer NOT NULL,
    created_by character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp without time zone,
    completed_by character varying(255),
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- TOC entry 239 (class 1259 OID 24859)
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3669 (class 0 OID 0)
-- Dependencies: 239
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- TOC entry 223 (class 1259 OID 24677)
-- Name: user_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_groups (
    user_id character varying(255) NOT NULL,
    group_id integer NOT NULL
);


--
-- TOC entry 241 (class 1259 OID 24896)
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id character varying NOT NULL,
    role_id integer NOT NULL,
    assigned_by character varying NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 214 (class 1259 OID 24576)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255),
    name character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    profile_image_url text,
    password character varying(255),
    role character varying(50) DEFAULT 'employee'::character varying,
    password_changed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 3375 (class 2604 OID 24984)
-- Name: customer_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_orders ALTER COLUMN id SET DEFAULT nextval('public.customer_orders_id_seq'::regclass);


--
-- TOC entry 3354 (class 2604 OID 24985)
-- Name: deliveries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries ALTER COLUMN id SET DEFAULT nextval('public.deliveries_id_seq'::regclass);


--
-- TOC entry 3383 (class 2604 OID 24986)
-- Name: dlc_products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dlc_products ALTER COLUMN id SET DEFAULT nextval('public.dlc_products_id_seq'::regclass);


--
-- TOC entry 3342 (class 2604 OID 24987)
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- TOC entry 3371 (class 2604 OID 24988)
-- Name: nocodb_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nocodb_config ALTER COLUMN id SET DEFAULT nextval('public.nocodb_config_id_seq'::regclass);


--
-- TOC entry 3350 (class 2604 OID 24989)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 3368 (class 2604 OID 24990)
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- TOC entry 3359 (class 2604 OID 24991)
-- Name: publicities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicities ALTER COLUMN id SET DEFAULT nextval('public.publicities_id_seq'::regclass);


--
-- TOC entry 3362 (class 2604 OID 24992)
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- TOC entry 3346 (class 2604 OID 24993)
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- TOC entry 3392 (class 2604 OID 24994)
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- TOC entry 3646 (class 0 OID 24792)
-- Dependencies: 236
-- Data for Name: customer_orders; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 3652 (class 0 OID 24922)
-- Dependencies: 242
-- Data for Name: database_backups; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.database_backups (id, filename, description, size, created_at, created_by, tables_count, status, backup_type) VALUES ('backup_1753121440168_6sty4guul', 'backup_1753121440168_6sty4guul.sql', 'test', 0, '2025-07-21 18:10:40.168522', 'admin', 0, 'creating', 'manual');
INSERT INTO public.database_backups (id, filename, description, size, created_at, created_by, tables_count, status, backup_type) VALUES ('backup_1753127871433_157b1swaf', 'backup_1753127871433_157b1swaf.sql', 'test', 0, '2025-07-21 19:57:51.433294', 'admin', 0, 'creating', 'manual');


--
-- TOC entry 3632 (class 0 OID 24644)
-- Dependencies: 222
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.deliveries (id, order_id, supplier_id, group_id, scheduled_date, delivered_date, quantity, unit, status, notes, bl_number, bl_amount, invoice_reference, invoice_amount, reconciled, validated_at, created_by, created_at, updated_at) VALUES (1, 4, 19, 1, '2025-07-21', '2025-07-21 14:01:51.972', 1, 'palettes', 'delivered', NULL, '25005307', NULL, NULL, NULL, false, '2025-07-21 14:01:51.972', 'admin_local', '2025-07-21 13:26:00.398155', '2025-07-21 14:01:51.973005');
INSERT INTO public.deliveries (id, order_id, supplier_id, group_id, scheduled_date, delivered_date, quantity, unit, status, notes, bl_number, bl_amount, invoice_reference, invoice_amount, reconciled, validated_at, created_by, created_at, updated_at) VALUES (2, 1, 10, 1, '2025-07-18', '2025-07-21 13:58:40.966', 2, 'palettes', 'delivered', NULL, '00395879', NULL, '', NULL, false, '2025-07-21 13:58:40.966', 'admin_local', '2025-07-21 13:55:35.448864', '2025-07-21 14:10:17.810938');


--
-- TOC entry 3648 (class 0 OID 24823)
-- Dependencies: 238
-- Data for Name: dlc_products; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 3626 (class 0 OID 24592)
-- Dependencies: 216
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.groups (id, name, color, nocodb_config_id, nocodb_table_id, nocodb_table_name, invoice_column_name, created_at, updated_at) VALUES (2, 'Houdemont', '#455A64', NULL, NULL, NULL, NULL, '2025-07-21 13:20:12.824606', '2025-07-21 13:27:54.859973');
INSERT INTO public.groups (id, name, color, nocodb_config_id, nocodb_table_id, nocodb_table_name, invoice_column_name, created_at, updated_at) VALUES (1, 'Frouard', '#1976D2', NULL, NULL, NULL, NULL, '2025-07-21 13:20:01.734711', '2025-07-21 13:28:08.540302');


--
-- TOC entry 3644 (class 0 OID 24775)
-- Dependencies: 234
-- Data for Name: nocodb_config; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.nocodb_config (id, name, base_url, project_id, api_token, description, is_active, created_by, created_at, updated_at) VALUES (1, 'Nocodb', 'https://nocodb.ffnancy.fr', 'admin', 'z4BAwLo6dgoN_E7PKJSHN7PA7kdBePtKOYcsDlwQ', '', true, 'admin_local', '2025-07-21 13:27:12.251235', '2025-07-21 13:27:12.251235');


--
-- TOC entry 3630 (class 0 OID 24616)
-- Dependencies: 220
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orders (id, supplier_id, group_id, planned_date, quantity, unit, status, notes, created_by, created_at, updated_at) VALUES (2, 5, 1, '2025-07-17', NULL, NULL, 'pending', NULL, 'admin_local', '2025-07-21 13:23:38.109768', '2025-07-21 13:23:38.109768');
INSERT INTO public.orders (id, supplier_id, group_id, planned_date, quantity, unit, status, notes, created_by, created_at, updated_at) VALUES (3, 11, 1, '2025-07-17', NULL, NULL, 'pending', NULL, 'admin_local', '2025-07-21 13:23:47.469368', '2025-07-21 13:23:47.469368');
INSERT INTO public.orders (id, supplier_id, group_id, planned_date, quantity, unit, status, notes, created_by, created_at, updated_at) VALUES (5, 23, 1, '2025-07-21', NULL, NULL, 'pending', NULL, 'admin_local', '2025-07-21 13:26:29.412241', '2025-07-21 13:26:29.412241');
INSERT INTO public.orders (id, supplier_id, group_id, planned_date, quantity, unit, status, notes, created_by, created_at, updated_at) VALUES (6, 22, 1, '2025-07-17', NULL, NULL, 'pending', NULL, 'admin_local', '2025-07-21 13:26:36.822077', '2025-07-21 13:26:36.822077');
INSERT INTO public.orders (id, supplier_id, group_id, planned_date, quantity, unit, status, notes, created_by, created_at, updated_at) VALUES (1, 10, 1, '2025-07-12', NULL, NULL, 'delivered', NULL, 'admin_local', '2025-07-21 13:23:29.927012', '2025-07-21 13:58:40.971243');
INSERT INTO public.orders (id, supplier_id, group_id, planned_date, quantity, unit, status, notes, created_by, created_at, updated_at) VALUES (4, 19, 1, '2025-07-11', NULL, NULL, 'delivered', NULL, 'admin_local', '2025-07-21 13:25:46.410635', '2025-07-21 14:01:51.975568');
INSERT INTO public.orders (id, supplier_id, group_id, planned_date, quantity, unit, status, notes, created_by, created_at, updated_at) VALUES (7, 29, 1, '2025-07-21', NULL, NULL, 'pending', NULL, 'admin_local', '2025-07-21 15:39:49.014721', '2025-07-21 15:39:49.014721');


--
-- TOC entry 3641 (class 0 OID 24747)
-- Dependencies: 231
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (1, 'dashboard_read', 'Voir tableau de bord', 'Accès en lecture au tableau de bord', 'tableau_de_bord', 'read', 'dashboard', true, '2025-07-21 17:14:32.201089');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (2, 'groups_read', 'Voir magasins', 'Accès en lecture aux magasins', 'magasins', 'read', 'groups', true, '2025-07-21 17:14:32.21064');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (3, 'groups_create', 'Créer magasins', 'Création de nouveaux magasins', 'magasins', 'create', 'groups', true, '2025-07-21 17:14:32.2259');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (4, 'groups_update', 'Modifier magasins', 'Modification des magasins existants', 'magasins', 'update', 'groups', true, '2025-07-21 17:14:32.234228');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (5, 'groups_delete', 'Supprimer magasins', 'Suppression de magasins', 'magasins', 'delete', 'groups', true, '2025-07-21 17:14:32.24411');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (6, 'suppliers_read', 'Voir fournisseurs', 'Accès en lecture aux fournisseurs', 'fournisseurs', 'read', 'suppliers', true, '2025-07-21 17:14:32.255374');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (7, 'suppliers_create', 'Créer fournisseurs', 'Création de nouveaux fournisseurs', 'fournisseurs', 'create', 'suppliers', true, '2025-07-21 17:14:32.277867');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (8, 'suppliers_update', 'Modifier fournisseurs', 'Modification des fournisseurs', 'fournisseurs', 'update', 'suppliers', true, '2025-07-21 17:14:32.28884');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (9, 'suppliers_delete', 'Supprimer fournisseurs', 'Suppression de fournisseurs', 'fournisseurs', 'delete', 'suppliers', true, '2025-07-21 17:14:32.301356');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (10, 'orders_read', 'Voir commandes', 'Accès en lecture aux commandes', 'commandes', 'read', 'orders', true, '2025-07-21 17:14:32.312072');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (11, 'orders_create', 'Créer commandes', 'Création de nouvelles commandes', 'commandes', 'create', 'orders', true, '2025-07-21 17:14:32.322409');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (12, 'orders_update', 'Modifier commandes', 'Modification des commandes', 'commandes', 'update', 'orders', true, '2025-07-21 17:14:32.355997');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (13, 'orders_delete', 'Supprimer commandes', 'Suppression de commandes', 'commandes', 'delete', 'orders', true, '2025-07-21 17:14:32.422718');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (14, 'deliveries_read', 'Voir livraisons', 'Accès en lecture aux livraisons', 'livraisons', 'read', 'deliveries', true, '2025-07-21 17:14:32.433816');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (15, 'deliveries_create', 'Créer livraisons', 'Création de nouvelles livraisons', 'livraisons', 'create', 'deliveries', true, '2025-07-21 17:14:32.467368');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (16, 'deliveries_update', 'Modifier livraisons', 'Modification des livraisons', 'livraisons', 'update', 'deliveries', true, '2025-07-21 17:14:32.478768');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (17, 'deliveries_delete', 'Supprimer livraisons', 'Suppression de livraisons', 'livraisons', 'delete', 'deliveries', true, '2025-07-21 17:14:32.512133');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (18, 'publicities_read', 'Voir publicités', 'Accès en lecture aux publicités', 'publicites', 'read', 'publicities', true, '2025-07-21 17:14:32.522997');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (19, 'publicities_create', 'Créer publicités', 'Création de nouvelles publicités', 'publicites', 'create', 'publicities', true, '2025-07-21 17:14:32.534718');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (20, 'publicities_update', 'Modifier publicités', 'Modification des publicités', 'publicites', 'update', 'publicities', true, '2025-07-21 17:14:32.54554');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (21, 'publicities_delete', 'Supprimer publicités', 'Suppression de publicités', 'publicites', 'delete', 'publicities', true, '2025-07-21 17:14:32.557021');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (22, 'publicities_participate', 'Participer aux publicités', 'Participation des magasins aux publicités', 'publicites', 'participate', 'publicities', true, '2025-07-21 17:14:32.567731');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (23, 'customer_orders_read', 'Voir commandes clients', 'Accès en lecture aux commandes clients', 'commandes_clients', 'read', 'customer_orders', true, '2025-07-21 17:14:32.579196');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (24, 'customer_orders_create', 'Créer commandes clients', 'Création de nouvelles commandes clients', 'commandes_clients', 'create', 'customer_orders', true, '2025-07-21 17:14:32.590124');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (25, 'customer_orders_update', 'Modifier commandes clients', 'Modification des commandes clients', 'commandes_clients', 'update', 'customer_orders', true, '2025-07-21 17:14:32.60136');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (26, 'customer_orders_delete', 'Supprimer commandes clients', 'Suppression de commandes clients', 'commandes_clients', 'delete', 'customer_orders', true, '2025-07-21 17:14:32.634859');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (27, 'customer_orders_print', 'Imprimer commandes clients', 'Impression des barcodes et documents', 'commandes_clients', 'print', 'customer_orders', true, '2025-07-21 17:14:32.646061');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (28, 'users_read', 'Voir utilisateurs', 'Accès en lecture aux utilisateurs', 'utilisateurs', 'read', 'users', true, '2025-07-21 17:14:32.681401');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (29, 'users_create', 'Créer utilisateurs', 'Création de nouveaux utilisateurs', 'utilisateurs', 'create', 'users', true, '2025-07-21 17:14:32.722283');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (30, 'users_update', 'Modifier utilisateurs', 'Modification des utilisateurs', 'utilisateurs', 'update', 'users', true, '2025-07-21 17:14:32.74677');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (31, 'users_delete', 'Supprimer utilisateurs', 'Suppression d''utilisateurs', 'utilisateurs', 'delete', 'users', true, '2025-07-21 17:14:32.757591');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (32, 'roles_read', 'Voir rôles', 'Accès en lecture aux rôles', 'gestion_roles', 'read', 'roles', true, '2025-07-21 17:14:32.868725');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (33, 'roles_create', 'Créer rôles', 'Création de nouveaux rôles', 'gestion_roles', 'create', 'roles', true, '2025-07-21 17:14:32.935573');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (34, 'roles_update', 'Modifier rôles', 'Modification des rôles', 'gestion_roles', 'update', 'roles', true, '2025-07-21 17:14:32.957738');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (35, 'roles_delete', 'Supprimer rôles', 'Suppression de rôles', 'gestion_roles', 'delete', 'roles', true, '2025-07-21 17:14:33.025587');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (36, 'permissions_read', 'Voir permissions', 'Accès en lecture aux permissions', 'gestion_roles', 'read', 'permissions', true, '2025-07-21 17:14:33.081127');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (37, 'permissions_assign', 'Assigner permissions', 'Attribution de permissions aux rôles', 'gestion_roles', 'assign', 'permissions', true, '2025-07-21 17:14:33.137254');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (38, 'bl_reconciliation_read', 'Voir rapprochement BL', 'Accès au rapprochement des bons de livraison', 'rapprochement', 'read', 'bl_reconciliation', true, '2025-07-21 17:14:33.148369');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (39, 'bl_reconciliation_update', 'Modifier rapprochement BL', 'Modification du rapprochement des BL', 'rapprochement', 'update', 'bl_reconciliation', true, '2025-07-21 17:14:33.211654');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (40, 'nocodb_config_read', 'Voir config NocoDB', 'Accès à la configuration NocoDB', 'administration', 'read', 'nocodb_config', true, '2025-07-21 17:14:33.237495');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (41, 'nocodb_config_update', 'Modifier config NocoDB', 'Modification de la configuration NocoDB', 'administration', 'update', 'nocodb_config', true, '2025-07-21 17:14:33.249086');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (42, 'system_admin', 'Administration système', 'Accès complet à l''administration', 'administration', 'admin', 'system', true, '2025-07-21 17:14:33.28202');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (43, 'calendar_read', 'Voir calendrier', 'Accès en lecture au calendrier', 'calendrier', 'read', 'calendar', true, '2025-07-21 17:14:33.293133');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (44, 'calendar_update', 'Modifier calendrier', 'Modification des événements du calendrier', 'calendrier', 'update', 'calendar', true, '2025-07-21 17:14:33.415614');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (45, 'dlc_read', 'Voir produits DLC', 'Accès en lecture aux produits DLC', 'gestion_dlc', 'read', 'dlc', true, '2025-07-21 17:14:33.536059');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (46, 'dlc_create', 'Créer produits DLC', 'Création de nouveaux produits DLC', 'gestion_dlc', 'create', 'dlc', true, '2025-07-21 17:14:33.673455');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (47, 'dlc_update', 'Modifier produits DLC', 'Modification des produits DLC', 'gestion_dlc', 'update', 'dlc', true, '2025-07-21 17:14:33.918595');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (48, 'dlc_delete', 'Supprimer produits DLC', 'Suppression de produits DLC', 'gestion_dlc', 'delete', 'dlc', true, '2025-07-21 17:14:34.053131');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (49, 'dlc_validate', 'Valider produits DLC', 'Validation des produits DLC', 'gestion_dlc', 'validate', 'dlc', true, '2025-07-21 17:14:34.175203');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (50, 'dlc_print', 'Imprimer étiquettes DLC', 'Impression des étiquettes DLC', 'gestion_dlc', 'print', 'dlc', true, '2025-07-21 17:14:34.29764');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (51, 'dlc_stats', 'Voir statistiques DLC', 'Accès aux statistiques DLC', 'gestion_dlc', 'stats', 'dlc', true, '2025-07-21 17:14:34.464441');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (52, 'tasks_read', 'Voir tâches', 'Accès en lecture aux tâches', 'gestion_taches', 'read', 'tasks', true, '2025-07-21 17:14:34.598147');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (53, 'tasks_create', 'Créer tâches', 'Création de nouvelles tâches', 'gestion_taches', 'create', 'tasks', true, '2025-07-21 17:14:34.698473');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (54, 'tasks_update', 'Modifier tâches', 'Modification des tâches', 'gestion_taches', 'update', 'tasks', true, '2025-07-21 17:14:34.843011');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (55, 'tasks_delete', 'Supprimer tâches', 'Suppression de tâches', 'gestion_taches', 'delete', 'tasks', true, '2025-07-21 17:14:34.987699');
INSERT INTO public.permissions (id, name, display_name, description, category, action, resource, is_system, created_at) VALUES (56, 'tasks_assign', 'Assigner tâches', 'Attribution de tâches aux utilisateurs', 'gestion_taches', 'assign', 'tasks', true, '2025-07-21 17:14:35.178312');


--
-- TOC entry 3636 (class 0 OID 24700)
-- Dependencies: 226
-- Data for Name: publicities; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 3637 (class 0 OID 24715)
-- Dependencies: 227
-- Data for Name: publicity_participations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 3642 (class 0 OID 24759)
-- Dependencies: 232
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 44);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 40);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 41);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 42);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 43);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 6);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 7);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 8);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 9);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 10);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 11);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 1);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 2);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 3);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 4);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 5);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 6);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 7);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 8);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 9);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 10);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 11);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 12);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 13);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 14);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 15);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 16);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 17);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 18);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 19);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 20);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 21);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 22);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 23);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 24);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 25);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 26);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 27);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 28);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 29);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 30);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (1, 31);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 12);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 13);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 14);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (3, 43);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 15);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 16);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 17);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 18);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 23);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 24);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 25);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 26);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 27);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 38);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 39);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 43);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 44);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 45);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 46);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 47);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 48);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 49);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 6);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 7);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 8);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 9);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 10);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 11);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 12);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 13);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 14);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 15);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 16);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 17);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 18);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 23);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 24);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 25);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 26);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 27);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 38);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 39);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 43);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 44);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 45);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 46);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 47);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 48);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 49);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 50);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 51);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 52);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 53);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 54);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 55);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 56);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (4, 1);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 50);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 51);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 52);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 53);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 54);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 55);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 56);
INSERT INTO public.role_permissions (role_id, permission_id) VALUES (5, 1);


--
-- TOC entry 3639 (class 0 OID 24731)
-- Dependencies: 229
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.roles (id, name, display_name, description, color, is_system, is_active, created_at, updated_at) VALUES (1, 'admin', 'Administrateur', 'Accès complet à toutes les fonctionnalités', '#dc2626', true, true, '2025-07-21 17:14:32.166631', '2025-07-21 17:14:32.166631');
INSERT INTO public.roles (id, name, display_name, description, color, is_system, is_active, created_at, updated_at) VALUES (2, 'manager', 'Manager', 'Gestion des commandes, livraisons et fournisseurs', '#2563eb', true, true, '2025-07-21 17:14:32.176992', '2025-07-21 17:14:32.176992');
INSERT INTO public.roles (id, name, display_name, description, color, is_system, is_active, created_at, updated_at) VALUES (3, 'employee', 'Employé', 'Accès en lecture aux données et publicités', '#16a34a', true, true, '2025-07-21 17:14:32.188369', '2025-07-21 17:14:32.188369');
INSERT INTO public.roles (id, name, display_name, description, color, is_system, is_active, created_at, updated_at) VALUES (4, 'directeur', 'Directeur', 'Supervision générale et gestion stratégique', '#7c3aed', true, true, '2025-07-21 12:11:13.672295', '2025-07-21 12:11:13.672295');
INSERT INTO public.roles (id, name, display_name, description, color, is_system, is_active, created_at, updated_at) VALUES (5, 'Dir', 'Dir', 'Supervision générale et gestion stratégique', '#f73bf1', false, true, '2025-07-21 13:16:43.82584', '2025-07-21 13:32:03.43032');


--
-- TOC entry 3634 (class 0 OID 24692)
-- Dependencies: 224
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.session (sid, sess, expire) VALUES ('pln6UhYkTs3Bo4mfoSb7TqjydmaPJXKY', '{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-22T13:34:35.365Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":"admin_local"}}', '2025-07-22 15:40:08');
INSERT INTO public.session (sid, sess, expire) VALUES ('nYbzGMWRZN7qXATHKqh2azgh7j2l5M_o', '{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-22T16:03:32.835Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":"admin_local"}}', '2025-07-22 16:45:30');
INSERT INTO public.session (sid, sess, expire) VALUES ('rReKIB-Q0Kx4ASdqXSfrUyV2oMkIsNHV', '{"cookie":{"originalMaxAge":86400000,"expires":"2025-07-22T17:17:38.563Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":"admin_local"}}', '2025-07-22 19:57:49');


--
-- TOC entry 3628 (class 0 OID 24604)
-- Dependencies: 218
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (1, 'Artifete', '', '', false, '2025-07-21 13:21:14.589487', '2025-07-21 13:21:14.589487');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (2, 'Ar Pyramid', '', '', false, '2025-07-21 13:21:26.118364', '2025-07-21 13:21:26.118364');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (3, 'Amefa', '', '', false, '2025-07-21 13:21:32.464186', '2025-07-21 13:21:32.464186');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (4, 'Auxence', '', '', false, '2025-07-21 13:21:39.191373', '2025-07-21 13:21:39.191373');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (5, 'BI2L', '', '', false, '2025-07-21 13:21:48.870102', '2025-07-21 13:21:48.870102');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (6, 'Baby délice', '', '', true, '2025-07-21 13:21:54.273324', '2025-07-21 13:21:54.273324');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (7, 'CMP', '', '', false, '2025-07-21 13:22:00.955869', '2025-07-21 13:22:00.955869');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (8, 'Cotillon d''Alasce', '', '', false, '2025-07-21 13:22:07.350851', '2025-07-21 13:22:07.350851');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (9, 'Edition du Tonnerre', '', '', false, '2025-07-21 13:22:12.91167', '2025-07-21 13:22:12.91167');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (10, 'Homea', '', '', false, '2025-07-21 13:22:18.426291', '2025-07-21 13:22:18.426291');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (11, 'Frandis', '', '', false, '2025-07-21 13:22:25.01497', '2025-07-21 13:22:25.01497');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (12, 'Fornord', '', '', false, '2025-07-21 13:22:27.687974', '2025-07-21 13:22:27.687974');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (13, 'Grundl', '', '', false, '2025-07-21 13:22:40.189607', '2025-07-21 13:22:40.189607');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (14, 'Decor10', '', '', false, '2025-07-21 13:22:46.195388', '2025-07-21 13:22:46.195388');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (15, 'Distrifil', '', '', false, '2025-07-21 13:22:49.934635', '2025-07-21 13:22:49.934635');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (18, 'L3C', '', '', false, '2025-07-21 13:23:08.378618', '2025-07-21 13:23:08.378618');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (19, 'Maxel', '', '', false, '2025-07-21 13:24:03.599551', '2025-07-21 13:24:03.599551');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (20, 'Metaltex', '', '', false, '2025-07-21 13:24:07.985744', '2025-07-21 13:24:07.985744');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (17, 'Lidis', '', '', true, '2025-07-21 13:23:04.410431', '2025-07-21 13:24:21.816856');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (22, 'Zamibo', '', '', false, '2025-07-21 13:24:35.148032', '2025-07-21 13:24:35.148032');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (23, 'Sovacom', '', '', false, '2025-07-21 13:24:43.360824', '2025-07-21 13:24:43.360824');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (24, 'Tendance', '', '', false, '2025-07-21 13:24:49.373274', '2025-07-21 13:24:49.373274');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (25, 'Out Of the Blue', '', '', false, '2025-07-21 13:25:00.981109', '2025-07-21 13:25:00.981109');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (26, 'Puckator', '', '', false, '2025-07-21 13:25:05.344153', '2025-07-21 13:25:05.344153');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (27, 'Polyflame', '', '', false, '2025-07-21 13:25:09.743416', '2025-07-21 13:25:09.743416');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (28, 'CR Diffusion', '', '', false, '2025-07-21 13:25:13.556337', '2025-07-21 13:25:13.556337');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (16, 'Depot', '', '', true, '2025-07-21 13:22:53.694038', '2025-07-21 13:25:27.723909');
INSERT INTO public.suppliers (id, name, contact, phone, has_dlc, created_at, updated_at) VALUES (29, 'IDVPC', '', '', false, '2025-07-21 15:39:37.305194', '2025-07-21 15:39:37.305194');


--
-- TOC entry 3650 (class 0 OID 24860)
-- Dependencies: 240
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 3633 (class 0 OID 24677)
-- Dependencies: 223
-- Data for Name: user_groups; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_groups (user_id, group_id) VALUES ('_1753100468215', 1);


--
-- TOC entry 3651 (class 0 OID 24896)
-- Dependencies: 241
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_roles (user_id, role_id, assigned_by, assigned_at) VALUES ('admin_local', 1, 'admin_local', '2025-07-21 17:43:44.013941');
INSERT INTO public.user_roles (user_id, role_id, assigned_by, assigned_at) VALUES ('_1753100468215', 5, 'admin_local', '2025-07-21 13:17:32.258351');


--
-- TOC entry 3624 (class 0 OID 24576)
-- Dependencies: 214
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, username, email, name, first_name, last_name, profile_image_url, password, role, password_changed, created_at, updated_at) VALUES ('_1753100468215', 'Directeur', NULL, ' ', '', '', NULL, 'c95879a0d42adde8583b870b16f4b21d:2c19f8e602df1b1db3b5976c41e8255f76f75525e765ee55d57bf8ad51a6db28e559a04a15b81387d1f7a2823a4b7dbebcdfcb491334f9b120ab70e05db162d5', 'directeur', false, '2025-07-21 12:21:08.326014', '2025-07-21 12:21:08.326014');
INSERT INTO public.users (id, username, email, name, first_name, last_name, profile_image_url, password, role, password_changed, created_at, updated_at) VALUES ('admin_local', 'admin', 'admin@logiflow.com', 'Administrateur', 'Admin', 'LogiFlow', NULL, 'a220be0526cf9c76e962f59cd2ea0cbc:2a8d42515dd2c8dbc0bc6701c9e004c3040802e41c44742e8cf4f67c429340e3ad7377d293ae2574a53ddeb72f1284b55927ea3247e90ab7c842ea8b2318e09c', 'admin', false, '2025-07-21 17:14:32.122791', '2025-07-21 17:14:32.122791');


--
-- TOC entry 3670 (class 0 OID 0)
-- Dependencies: 235
-- Name: customer_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_orders_id_seq', 1, false);


--
-- TOC entry 3671 (class 0 OID 0)
-- Dependencies: 221
-- Name: deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.deliveries_id_seq', 2, true);


--
-- TOC entry 3672 (class 0 OID 0)
-- Dependencies: 237
-- Name: dlc_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dlc_products_id_seq', 1, false);


--
-- TOC entry 3673 (class 0 OID 0)
-- Dependencies: 215
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.groups_id_seq', 2, true);


--
-- TOC entry 3674 (class 0 OID 0)
-- Dependencies: 233
-- Name: nocodb_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nocodb_config_id_seq', 1, true);


--
-- TOC entry 3675 (class 0 OID 0)
-- Dependencies: 219
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 7, true);


--
-- TOC entry 3676 (class 0 OID 0)
-- Dependencies: 230
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 57, true);


--
-- TOC entry 3677 (class 0 OID 0)
-- Dependencies: 225
-- Name: publicities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.publicities_id_seq', 1, false);


--
-- TOC entry 3678 (class 0 OID 0)
-- Dependencies: 228
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- TOC entry 3679 (class 0 OID 0)
-- Dependencies: 217
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 29, true);


--
-- TOC entry 3680 (class 0 OID 0)
-- Dependencies: 239
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- TOC entry 3442 (class 2606 OID 24806)
-- Name: customer_orders customer_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_orders
    ADD CONSTRAINT customer_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3453 (class 2606 OID 24932)
-- Name: database_backups database_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.database_backups
    ADD CONSTRAINT database_backups_pkey PRIMARY KEY (id);


--
-- TOC entry 3420 (class 2606 OID 24656)
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- TOC entry 3444 (class 2606 OID 24838)
-- Name: dlc_products dlc_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dlc_products
    ADD CONSTRAINT dlc_products_pkey PRIMARY KEY (id);


--
-- TOC entry 3414 (class 2606 OID 24602)
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3440 (class 2606 OID 24785)
-- Name: nocodb_config nocodb_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nocodb_config
    ADD CONSTRAINT nocodb_config_pkey PRIMARY KEY (id);


--
-- TOC entry 3418 (class 2606 OID 24627)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3434 (class 2606 OID 24758)
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- TOC entry 3436 (class 2606 OID 24756)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3426 (class 2606 OID 24709)
-- Name: publicities publicities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicities
    ADD CONSTRAINT publicities_pkey PRIMARY KEY (id);


--
-- TOC entry 3428 (class 2606 OID 24719)
-- Name: publicity_participations publicity_participations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicity_participations
    ADD CONSTRAINT publicity_participations_pkey PRIMARY KEY (publicity_id, group_id);


--
-- TOC entry 3438 (class 2606 OID 24763)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 3430 (class 2606 OID 24745)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 3432 (class 2606 OID 24743)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3424 (class 2606 OID 24698)
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- TOC entry 3416 (class 2606 OID 24614)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 3446 (class 2606 OID 24873)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3422 (class 2606 OID 24681)
-- Name: user_groups user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_pkey PRIMARY KEY (user_id, group_id);


--
-- TOC entry 3451 (class 2606 OID 24903)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- TOC entry 3408 (class 2606 OID 24590)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3410 (class 2606 OID 24586)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3412 (class 2606 OID 24588)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3447 (class 1259 OID 24921)
-- Name: idx_user_roles_assigned_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_assigned_by ON public.user_roles USING btree (assigned_by);


--
-- TOC entry 3448 (class 1259 OID 24920)
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- TOC entry 3449 (class 1259 OID 24919)
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- TOC entry 3469 (class 2606 OID 24817)
-- Name: customer_orders customer_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_orders
    ADD CONSTRAINT customer_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3470 (class 2606 OID 24812)
-- Name: customer_orders customer_orders_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_orders
    ADD CONSTRAINT customer_orders_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3471 (class 2606 OID 24807)
-- Name: customer_orders customer_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_orders
    ADD CONSTRAINT customer_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- TOC entry 3457 (class 2606 OID 24672)
-- Name: deliveries deliveries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3458 (class 2606 OID 24667)
-- Name: deliveries deliveries_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3459 (class 2606 OID 24657)
-- Name: deliveries deliveries_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- TOC entry 3460 (class 2606 OID 24662)
-- Name: deliveries deliveries_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- TOC entry 3472 (class 2606 OID 24854)
-- Name: dlc_products dlc_products_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dlc_products
    ADD CONSTRAINT dlc_products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3473 (class 2606 OID 24849)
-- Name: dlc_products dlc_products_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dlc_products
    ADD CONSTRAINT dlc_products_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3474 (class 2606 OID 24839)
-- Name: dlc_products dlc_products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dlc_products
    ADD CONSTRAINT dlc_products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- TOC entry 3475 (class 2606 OID 24844)
-- Name: dlc_products dlc_products_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dlc_products
    ADD CONSTRAINT dlc_products_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.users(id);


--
-- TOC entry 3468 (class 2606 OID 24786)
-- Name: nocodb_config nocodb_config_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nocodb_config
    ADD CONSTRAINT nocodb_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3454 (class 2606 OID 24638)
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3455 (class 2606 OID 24633)
-- Name: orders orders_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3456 (class 2606 OID 24628)
-- Name: orders orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- TOC entry 3463 (class 2606 OID 24710)
-- Name: publicities publicities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicities
    ADD CONSTRAINT publicities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3464 (class 2606 OID 24725)
-- Name: publicity_participations publicity_participations_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicity_participations
    ADD CONSTRAINT publicity_participations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3465 (class 2606 OID 24720)
-- Name: publicity_participations publicity_participations_publicity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publicity_participations
    ADD CONSTRAINT publicity_participations_publicity_id_fkey FOREIGN KEY (publicity_id) REFERENCES public.publicities(id) ON DELETE CASCADE;


--
-- TOC entry 3466 (class 2606 OID 24769)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 3467 (class 2606 OID 24764)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 3476 (class 2606 OID 25010)
-- Name: tasks tasks_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 3477 (class 2606 OID 24879)
-- Name: tasks tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3478 (class 2606 OID 24874)
-- Name: tasks tasks_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3461 (class 2606 OID 24687)
-- Name: user_groups user_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3462 (class 2606 OID 24682)
-- Name: user_groups user_groups_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3479 (class 2606 OID 24914)
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- TOC entry 3480 (class 2606 OID 24909)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 3481 (class 2606 OID 24904)
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-07-21 19:57:51 UTC

--
-- PostgreSQL database dump complete
--

