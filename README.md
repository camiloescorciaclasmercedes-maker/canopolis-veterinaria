# Canópolis — Spring Boot + MySQL + XAMPP

Aplicación web desarrollada con **Java 17, Spring Boot 3.3.3, Spring Data JPA y MySQL**. El proyecto incluye páginas web estáticas, autenticación, productos, carrito, pedidos, citas e historia clínica.

## Tecnologías

- Java 17
- Spring Boot 3.3.3
- Spring Web
- Spring Data JPA / Hibernate
- MySQL
- Maven
- HTML, CSS y JavaScript
- XAMPP (para ejecutar MySQL localmente)

## Requisitos

1. Java JDK 17 o superior.
2. Maven, o un IDE compatible con Maven (VS Code, IntelliJ IDEA, Eclipse, etc.).
3. XAMPP con **MySQL** iniciado.

## Ejecutar localmente

1. Clona este repositorio o descarga el proyecto.
2. Abre XAMPP y pulsa **Start** en MySQL.
3. Abre el proyecto en tu IDE.
4. Ejecuta:

```bash
mvn spring-boot:run
```

También puedes ejecutar `DemoApplication.java` directamente desde el IDE.

La aplicación quedará disponible en:

```text
http://localhost:8080
```

La configuración incluida usa MySQL local con:

- Host: `localhost`
- Puerto: `3306`
- Base de datos: `demo_db`
- Usuario: `root`
- Contraseña: vacía, según la configuración predeterminada de XAMPP

> Si tu instalación de MySQL tiene contraseña o utiliza otro puerto, modifica `src/main/resources/application.properties` antes de ejecutar el proyecto.

## Endpoints de prueba

- `GET /api/conexion` — comprobar la conexión con MySQL.
- `GET /api/usuarios` — listar usuarios.
- `POST /api/usuarios` — crear un usuario.

Ejemplo de usuario:

```json
{
  "nombre": "Juan Perez",
  "email": "juan@example.com"
}
```

## Estructura principal

```text
src/
├── main/
│   ├── java/com/example/demo/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── model/
│   │   └── repository/
│   └── resources/
│       ├── static/
│       └── application.properties
├── .env.example
├── .gitignore
├── pom.xml
└── README.md
```

## Nota sobre GitHub

El proyecto está preparado para publicarse en GitHub. Se excluyen archivos generados por Maven (`target/`), configuraciones personales del IDE y archivos de entorno que puedan contener secretos.

La configuración de MySQL incluida corresponde a un entorno local de desarrollo con XAMPP. **No publiques contraseñas reales, claves API ni otros secretos en un repositorio público.**
