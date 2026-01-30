export interface Tribunal {
    id: string;
    nombre: string;
}

export interface Corte {
    id: string;
    nombre: string;
    tribunales: Tribunal[];
}

// Mapping of Cortes and Tribunales for Competencia Civil (ID: 3)
// Extracted from PJUD on 2026-01-29
export const PJUD_CORTES: Corte[] = [
    {
        id: "10",
        nombre: "C.A. de Arica",
        tribunales: [
            { nombre: "1º Juzgado de Letras de Arica", id: "2" },
            { nombre: "1º Juzgado De Letras de Arica ex 4°", id: "1400" },
            { nombre: "2º Juzgado de Letras de Arica", id: "3" },
            { nombre: "2º Juzgado De Letras de Arica ex 4°", id: "1401" },
            { nombre: "3º Juzgado de Letras de Arica", id: "4" },
            { nombre: "3º Juzgado de Letras de Arica Ex 4º", id: "5" }
        ]
    },
    {
        id: "11",
        nombre: "C.A. de Iquique",
        tribunales: [
            { nombre: "Juzgado de Letras y Gar. Pozo Almonte", id: "6" },
            { nombre: "1º Juzgado de Letras de Iquique", id: "9" },
            { nombre: "2º Juzgado de Letras de Iquique", id: "10" },
            { nombre: "3º Juzgado de Letras de Iquique", id: "11" }
        ]
    },
    {
        id: "15",
        nombre: "C.A. de Antofagasta",
        tribunales: [
            { nombre: "Juzgado de Letras Tocopilla", id: "13" },
            { nombre: "Juzgado de Letras y Gar.de María Elena", id: "14" },
            { nombre: "1º Juzgado de Letras de Calama", id: "16" },
            { nombre: "2º Juzgado de Letras de Calama", id: "17" },
            { nombre: "3º Juzgado de Letras de Calama", id: "658" },
            { nombre: "Juzgado de Letras y Gar. de Taltal", id: "26" },
            { nombre: "1º Juzgado de Letras Civil de Antofagasta", id: "1041" },
            { nombre: "2º Juzgado de Letras Civil de Antofagasta", id: "1042" },
            { nombre: "3º Juzgado de Letras Civil de Antofagasta", id: "1043" },
            { nombre: "4 ° Juzgado de Letras Civil de Antofagasta", id: "1044" },
            { nombre: "Juzgado de Letras y Garantía Mejillones", id: "1501" }
        ]
    },
    {
        id: "20",
        nombre: "C.A. de Copiapó",
        tribunales: [
            { nombre: "Juzgado de Letras y Gar. de Chañaral", id: "27" },
            { nombre: "Juzgado de Letras de Diego de Almagro", id: "29" },
            { nombre: "1º Juzgado de Letras de Copiapó", id: "31" },
            { nombre: "2º Juzgado de Letras de Copiapó", id: "32" },
            { nombre: "3º Juzgado de Letras de Copiapó", id: "33" },
            { nombre: "Juzgado de Letras y Gar.de Freirina", id: "34" },
            { nombre: "4º Juzgado de Letras de Copiapó", id: "926" },
            { nombre: "1º Juzgado de Letras de Vallenar", id: "36" },
            { nombre: "2º Juzgado de Letras de Vallenar", id: "37" },
            { nombre: "Juzgado de Letras y Gar.de Caldera", id: "386" }
        ]
    },
    {
        id: "25",
        nombre: "C.A. de La Serena",
        tribunales: [
            { nombre: "1º Juzgado de Letras de la Serena", id: "40" },
            { nombre: "2º Juzgado de Letras de la Serena", id: "41" },
            { nombre: "3º Juzgado de Letras de la Serena", id: "42" },
            { nombre: "1º Juzgado de Letras de Coquimbo", id: "43" },
            { nombre: "2º Juzgado de Letras de Coquimbo", id: "44" },
            { nombre: "3º Juzgado de Letras de Coquimbo", id: "45" },
            { nombre: "Juzgado de Letras de Vicuña", id: "46" },
            { nombre: "Juzgado de letras y garantía de Andacollo", id: "47" },
            { nombre: "1º Juzgado de Letras de Ovalle", id: "48" },
            { nombre: "2º Juzgado de Letras de Ovalle", id: "49" },
            { nombre: "3º Juzgado de Letras de Ovalle", id: "50" },
            { nombre: "Juzgado de Letras y Gar.de Combarbalá", id: "51" },
            { nombre: "Juzgado de Letras de Illapel", id: "52" },
            { nombre: "Juzgado de Letras y Gar. de los Vilos", id: "53" }
        ]
    },
    {
        id: "30",
        nombre: "C.A. de Valparaíso",
        tribunales: [
            { nombre: "1º Juzgado Civil de Valparaíso", id: "56" },
            { nombre: "2º Juzgado Civil de Valparaíso", id: "55" },
            { nombre: "3º Juzgado Civil de Valparaíso", id: "54" },
            { nombre: "4º Juzgado Civil de Valparaíso", id: "59" },
            { nombre: "5º Juzgado Civil de Valparaíso", id: "60" },
            { nombre: "1º Juzgado Civil de Viña del Mar", id: "57" },
            { nombre: "2º Juzgado Civil de Viña del Mar", id: "58" },
            { nombre: "3º Juzgado Civil de Viña del Mar", id: "61" },
            { nombre: "1º Juzgado de Letras de Quilpue", id: "83" },
            { nombre: "2º Juzgado de Letras de Quilpue", id: "84" },
            { nombre: "Juzgado de Letras de Villa Alemana", id: "85" },
            { nombre: "Juzgado de Letras de Casablanca", id: "86" },
            { nombre: "Juzgado de Letras de La Ligua", id: "87" },
            { nombre: "Juzgado de Letras y Gar. de Petorca", id: "88" },
            { nombre: "1º Juzgado de Letras de Los Andes", id: "89" },
            { nombre: "2º Juzgado de Letras de Los Andes", id: "90" },
            { nombre: "1º Juzgado de Letras de San Felipe", id: "92" },
            { nombre: "1º Juzgado de Letras de San Felipe Ex 2º", id: "93" },
            { nombre: "Juzgado de Letras y Gar.de Putaendo", id: "94" },
            { nombre: "1º Juzgado de Letras de Quillota", id: "96" },
            { nombre: "2º Juzgado de Letras de Quillota", id: "97" },
            { nombre: "Juzgado de Letras de La Calera", id: "98" },
            { nombre: "Juzgado de Letras de Limache", id: "99" },
            { nombre: "1º Juzgado de Letras de San Antonio", id: "101" },
            { nombre: "2º Juzgado de Letras de San Antonio", id: "102" },
            { nombre: "Juzgado de Letras y Gar. de Isla de Pascua", id: "103" },
            { nombre: "Juzgado de Letras y Gar.de Quintero", id: "660" }
        ]
    },
    {
        id: "35",
        nombre: "C.A. de Rancagua",
        tribunales: [
            { nombre: "1º Juzgado Civil de Rancagua", id: "110" },
            { nombre: "2º Juzgado Civil de Rancagua", id: "969" },
            { nombre: "1º Juzgado de Letras de Rengo", id: "111" },
            { nombre: "Juzgado de Letras de San Vicente de Tagua Tagua", id: "113" },
            { nombre: "1º Juzgado de Letras y Gar.de Peumo", id: "114" },
            { nombre: "1º Juzgado de Letras de San Fernando", id: "115" },
            { nombre: "2º Juzgado de Letras de San Fernando", id: "116" },
            { nombre: "1º Juzgado de Letras de Santa Cruz", id: "117" },
            { nombre: "1º Juzgado De Letras De Santa Cruz Ex 2°", id: "118" },
            { nombre: "Juzgado de Letras y Gar.de Pichilemu", id: "119" },
            { nombre: "Juzgado de Letras y Gar.de Litueche", id: "1150" },
            { nombre: "Juzgado de Letras y Gar.de Peralillo", id: "1151" }
        ]
    },
    {
        id: "40",
        nombre: "C.A. de Talca",
        tribunales: [
            { nombre: "1º Juzgado de Letras de Talca", id: "122" },
            { nombre: "2º Juzgado de Letras de Talca", id: "123" },
            { nombre: "3º Juzgado de Letras de Talca", id: "124" },
            { nombre: "4º Juzgado de Letras de Talca", id: "125" },
            { nombre: "Juzgado de Letras de Constitución", id: "126" },
            { nombre: "Juzgado De Letras Y Gar. de Curepto", id: "127" },
            { nombre: "1º Juzgado de Letras de Curicó", id: "129" },
            { nombre: "2º Juzgado de Letras de Curicó", id: "130" },
            { nombre: "2º Juzgado de Letras de Curicó Ex 3°", id: "131" },
            { nombre: "Juzgado De Letras Y Gar. de Licantén", id: "132" },
            { nombre: "Juzgado de Letras de Molina", id: "133" },
            { nombre: "1º Juzgado de Letras de Linares", id: "135" },
            { nombre: "2º Juzgado de Letras de Linares", id: "136" },
            { nombre: "Juzgado de Letras de San Javier", id: "138" },
            { nombre: "Juzgado de Letras de Cauquenes", id: "139" },
            { nombre: "Juzgado de Letras y Gar. de Chanco", id: "140" },
            { nombre: "Juzgado de Letras de Parral", id: "141" }
        ]
    },
    {
        id: "45",
        nombre: "C.A. de Chillan",
        tribunales: [
            { nombre: "1º Juzgado Civil de Chillán", id: "145" },
            { nombre: "2º Juzgado Civil de Chillán", id: "146" },
            { nombre: "1º Juzgado de Letras de San Carlos", id: "147" },
            { nombre: "Juzgado de Letras de Yungay", id: "149" },
            { nombre: "Juzgado de Letras y Gar. de Bulnes", id: "150" },
            { nombre: "Juzgado de Letras y Gar.de Coelemu", id: "151" },
            { nombre: "Juzgado de Letras y Gar.de Quirihue", id: "152" }
        ]
    },
    {
        id: "46",
        nombre: "C.A. de Concepción",
        tribunales: [
            { nombre: "1º Juzgado de Letras de Los Angeles", id: "154" },
            { nombre: "2º Juzgado de Letras de Los Angeles", id: "155" },
            { nombre: "2° Juzgado de Letras de Los Angeles ex 3°", id: "156" },
            { nombre: "Juzgado de Letras y Gar. de Mulchen", id: "157" },
            { nombre: "Juzgado de Letras y Gar.de Nacimiento", id: "158" },
            { nombre: "Juzgado de Letras y Gar.de Laja", id: "159" },
            { nombre: "Juzgado de Letras y Gar.de Yumbel", id: "160" },
            { nombre: "1º Juzgado Civil de Concepción", id: "161" },
            { nombre: "2º Juzgado Civil de Concepción", id: "162" },
            { nombre: "3º Juzgado Civil de Concepción", id: "163" },
            { nombre: "1º Juzgado Civil de Talcahuano", id: "179" },
            { nombre: "2º Juzgado Civil de Talcahuano", id: "180" },
            { nombre: "Juzgado de Letras de Tomé", id: "187" },
            { nombre: "Juzgado de Letras y Gar.de Florida", id: "188" },
            { nombre: "Juzgado de Letras y Gar.de Santa Juana", id: "189" },
            { nombre: "Juzgado de Letras y Gar. de Lota", id: "190" },
            { nombre: "1º Juzgado de Letras de Coronel", id: "191" },
            { nombre: "2º Juzgado de Letras de Coronel", id: "192" },
            { nombre: "Juzgado de Letras y Gar.de Lebu", id: "193" },
            { nombre: "Juzgado de Letras de Arauco", id: "194" },
            { nombre: "Juzgado de Letras y Gar.de Curanilahue", id: "195" },
            { nombre: "Juzgado de Letras de Cañete", id: "196" },
            { nombre: "Juzgado de Letras y Gar. Santa Bárbara", id: "385" },
            { nombre: "Juzgado de Letras y Gar.de Cabrero", id: "1152" }
        ]
    },
    {
        id: "50",
        nombre: "C.A. de Temuco",
        tribunales: [
            { nombre: "1º Juzgado Civil de Temuco", id: "197" },
            { nombre: "2º Juzgado Civil de Temuco", id: "198" },
            { nombre: "Juzgado de Letras de Angol", id: "204" },
            { nombre: "Juzgado de Letras y Gar.de Collipulli", id: "206" },
            { nombre: "Juzgado de Letras y Gar.de Traiguén", id: "207" },
            { nombre: "Juzgado de Letras de Victoria", id: "208" },
            { nombre: "Juzgado de Letras y Gar.de Curacautin", id: "209" },
            { nombre: "Juzgado de Letras Loncoche", id: "210" },
            { nombre: "Juzgado de Letras de Pitrufquen", id: "211" },
            { nombre: "Juzgado de Letras de Villarrica", id: "212" },
            { nombre: "Juzgado de Letras de Nueva Imperial", id: "213" },
            { nombre: "Juzgado de Letras y Gar.de Pucón", id: "214" },
            { nombre: "Juzgado de Letras de Lautaro", id: "215" },
            { nombre: "Juzgado de Letras y Gar.de Carahue", id: "216" },
            { nombre: "3º Juzgado Civil de Temuco", id: "406" },
            { nombre: "Juzgado de Letras y Gar.de Tolten", id: "946" },
            { nombre: "Juzgado de Letras y Gar.de Puren", id: "947" }
        ]
    },
    {
        id: "55",
        nombre: "C.A. de Valdivia",
        tribunales: [
            { nombre: "1º Juzgado Civil de Valdivia", id: "220" },
            { nombre: "2º Juzgado Civil de Valdivia", id: "221" },
            { nombre: "Juzgado de Letras de Mariquina", id: "222" },
            { nombre: "Juzgado de Letras y Gar.de Paillaco", id: "223" },
            { nombre: "Juzgado de Letras Los Lagos", id: "224" },
            { nombre: "Juzgado de Letras y Gar. de Panguipulli", id: "225" },
            { nombre: "Juzgado de Letras y Gar.de la Unión", id: "226" },
            { nombre: "Juzgado de Letras y Gar.de Río Bueno", id: "227" },
            { nombre: "1º Juzgado de Letras de Osorno", id: "229" },
            { nombre: "2º Juzgado de Letras de Osorno", id: "230" },
            { nombre: "Juzgado de Letras de Rio Negro", id: "233" }
        ]
    },
    {
        id: "56",
        nombre: "C.A. de Puerto Montt",
        tribunales: [
            { nombre: "1º Juzgado Civil de Puerto Montt", id: "237" },
            { nombre: "2º Juzgado Civil de Puerto Montt", id: "1012" },
            { nombre: "Juzgado de Letras de Puerto Varas", id: "238" },
            { nombre: "Juzgado de Letras y Gar.de Calbuco", id: "240" },
            { nombre: "Juzgado de Letras y Gar. de Maullin", id: "241" },
            { nombre: "Juzgado de Letras de Castro", id: "242" },
            { nombre: "Juzgado de Letras de Ancud", id: "243" },
            { nombre: "Juzgado de Letras y Garantía de Achao", id: "244" },
            { nombre: "Juzgado de Letras y Gar. de Chaitén", id: "245" },
            { nombre: "Juzgado de Letras y Gar. de Los Muermos", id: "659" },
            { nombre: "Juzgado de Letras y Gar. de Quellón", id: "662" },
            { nombre: "Juzgado de Letras y Gar. de Hualaihue", id: "1013" }
        ]
    },
    {
        id: "60",
        nombre: "C.A. de Coyhaique",
        tribunales: [
            { nombre: "1º Juzgado de Letras de Coyhaique", id: "246" },
            { nombre: "1º Juzgado de Letras de Coyhaique Ex 2º", id: "247" },
            { nombre: "Juzgado de Letras y Gar.de pto.Aysen", id: "248" },
            { nombre: "Juzgado de Letras y Gar.de Chile Chico", id: "249" },
            { nombre: "Juzgado de Letras y Gar.de Cochrane", id: "250" },
            { nombre: "Juzgado de Letras y Gar.de Puerto Cisnes", id: "996" }
        ]
    },
    {
        id: "61",
        nombre: "C.A. de Punta Arenas",
        tribunales: [
            { nombre: "1º Juzgado de Letras de Punta Arenas", id: "253" },
            { nombre: "2º Juzgado de Letras de Punta Arenas", id: "254" },
            { nombre: "3º Juzgado de Letras de Punta Arenas", id: "255" },
            { nombre: "Juzgado de Letras y Gar. de Puerto Natales", id: "257" },
            { nombre: "Juzgado de Letras y Gar.de Porvenir", id: "258" },
            { nombre: "Juzgado de Letras y Garantía de Cabo de Hornos", id: "1502" }
        ]
    },
    {
        id: "90",
        nombre: "C.A. de Santiago",
        tribunales: [
            { nombre: "1º Juzgado Civil de Santiago", id: "259" },
            { nombre: "2º Juzgado Civil de Santiago", id: "260" },
            { nombre: "3º Juzgado Civil de Santiago", id: "261" },
            { nombre: "4º Juzgado Civil de Santiago", id: "262" },
            { nombre: "5º Juzgado Civil de Santiago", id: "263" },
            { nombre: "6º Juzgado Civil de Santiago", id: "264" },
            { nombre: "7º Juzgado Civil de Santiago", id: "265" },
            { nombre: "8º Juzgado Civil de Santiago", id: "266" },
            { nombre: "9º Juzgado Civil de Santiago", id: "267" },
            { nombre: "10º Juzgado Civil de Santiago", id: "268" },
            { nombre: "11º Juzgado Civil de Santiago", id: "269" },
            { nombre: "12º Juzgado Civil de Santiago", id: "270" },
            { nombre: "13º Juzgado Civil de Santiago", id: "271" },
            { nombre: "14º Juzgado Civil de Santiago", id: "272" },
            { nombre: "15º Juzgado Civil de Santiago", id: "273" },
            { nombre: "16º Juzgado Civil de Santiago", id: "274" },
            { nombre: "17º Juzgado Civil de Santiago", id: "275" },
            { nombre: "18º Juzgado Civil de Santiago", id: "276" },
            { nombre: "19º Juzgado Civil de Santiago", id: "277" },
            { nombre: "20º Juzgado Civil de Santiago", id: "278" },
            { nombre: "21º Juzgado Civil de Santiago", id: "279" },
            { nombre: "22º Juzgado Civil de Santiago", id: "280" },
            { nombre: "23º Juzgado Civil de Santiago", id: "281" },
            { nombre: "24º Juzgado Civil de Santiago", id: "282" },
            { nombre: "25º Juzgado Civil de Santiago", id: "283" },
            { nombre: "26º Juzgado Civil de Santiago", id: "284" },
            { nombre: "27º Juzgado Civil de Santiago", id: "285" },
            { nombre: "28º Juzgado Civil de Santiago", id: "286" },
            { nombre: "29º Juzgado Civil de Santiago", id: "287" },
            { nombre: "30º Juzgado Civil de Santiago", id: "288" },
            { nombre: "Juzgado de Letras de Colina", id: "387" }
        ]
    },
    {
        id: "91",
        nombre: "C.A. de San Miguel",
        tribunales: [
            { nombre: "1º Juzgado Civil de San Miguel", id: "343" },
            { nombre: "2º Juzgado Civil de San Miguel", id: "344" },
            { nombre: "3º Juzgado Civil de San Miguel", id: "345" },
            { nombre: "4º Juzgado Civil de San Miguel", id: "390" },
            { nombre: "1º Juzgado Civil de Puente Alto", id: "364" },
            { nombre: "1º Juzgado De Letras De Talagante", id: "373" },
            { nombre: "2º Juzgado De Letras De Talagante", id: "374" },
            { nombre: "1º Juzgado de Letras de Melipilla", id: "375" },
            { nombre: "1º Juzgado de Letras de Buin", id: "377" },
            { nombre: "2º Juzgado de Letras de Buin", id: "378" },
            { nombre: "Juzgado de Letras de Peñaflor", id: "388" },
            { nombre: "1º Juzgado de Letras de San Bernardo", id: "400" },
            { nombre: "1º Juzgado de Letras de San Bernardo Ex 3°", id: "1402" },
            { nombre: "2º Juzgado de Letras de San Bernardo", id: "401" },
            { nombre: "2º Juzgado de Letras de San Bernardo Ex 3°", id: "1403" }
        ]
    }
];
