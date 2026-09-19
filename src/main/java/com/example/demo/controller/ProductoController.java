package com.example.demo.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Producto;
import com.example.demo.repository.ProductoRepository;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    /**
     * Obtener productos activos con filtro opcional por categoría
     * GET /api/productos?categoria={categoria}
     */
    @GetMapping
    public List<Producto> listarProductos(@RequestParam(required = false) String categoria) {
        if (categoria != null && !categoria.trim().isEmpty() && !"TODOS".equalsIgnoreCase(categoria)) {
            return productoRepository.findByCategoriaAndActivoTrue(categoria);
        }
        return productoRepository.findByActivoTrue();
    }

    /**
     * Inventario completo (activos e inactivos) para administración
     * GET /api/productos/inventario
     */
    @GetMapping("/inventario")
    public List<Producto> listarInventario() {
        return productoRepository.findAll();
    }

    /**
     * Obtener producto por ID
     * GET /api/productos/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable Long id) {
        Optional<Producto> opt = productoRepository.findById(id);
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        }
        Map<String, Object> err = new HashMap<>();
        err.put("exito", false);
        err.put("mensaje", "Producto no encontrado.");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(err);
    }

    /**
     * Crear o editar un producto (Uso Administrativo)
     * POST /api/productos
     * Si el payload incluye id, actualiza el registro existente.
     */
    @PostMapping
    public ResponseEntity<?> guardarProducto(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();

        String nombre = asString(payload.get("nombre"));
        Double precio = asDouble(payload.get("precio"));
        if (nombre == null || nombre.isBlank() || precio == null) {
            response.put("exito", false);
            response.put("mensaje", "Nombre y precio son obligatorios.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        Long id = asLong(payload.get("id"));
        Producto producto;
        boolean esEdicion = false;

        if (id != null) {
            Optional<Producto> opt = productoRepository.findById(id);
            if (opt.isEmpty()) {
                response.put("exito", false);
                response.put("mensaje", "Producto no encontrado.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            producto = opt.get();
            esEdicion = true;
        } else {
            producto = new Producto();
            producto.setActivo(true);
        }

        aplicarCamposProducto(producto, payload, nombre, precio);
        Producto guardado = productoRepository.save(producto);

        response.put("exito", true);
        response.put("mensaje", esEdicion ? "Producto actualizado en inventario." : "Producto creado exitosamente.");
        response.put("producto", guardado);
        return ResponseEntity.status(esEdicion ? HttpStatus.OK : HttpStatus.CREATED).body(response);
    }

    /**
     * Actualizar producto
     * PUT /api/productos/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarProducto(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        payload.put("id", id);
        return guardarProducto(payload);
    }

    private void aplicarCamposProducto(Producto producto, Map<String, Object> payload, String nombre, Double precio) {
        producto.setNombre(nombre.trim());
        producto.setDescripcion(asString(payload.get("descripcion")));
        producto.setPrecio(precio);
        Integer stock = asInteger(payload.get("stock"));
        producto.setStock(stock != null ? stock : 0);

        String categoria = asString(payload.get("categoria"));
        producto.setCategoria(categoria != null && !categoria.isBlank() ? categoria.trim() : "General");

        Boolean receta = asBoolean(payload.get("requiereReceta"));
        if (receta == null) {
            receta = asBoolean(payload.get("requierePrescripcion"));
        }
        producto.setRequierePrescripcion(Boolean.TRUE.equals(receta));

        producto.setImagenUrl(asString(payload.get("imagenUrl")));

        Boolean activo = asBoolean(payload.get("activo"));
        if (activo != null) {
            producto.setActivo(activo);
        } else if (producto.getActivo() == null) {
            producto.setActivo(true);
        }
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private Long asLong(Object value) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(value.toString().replace(".0", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer asInteger(Object value) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            return (int) Math.round(Double.parseDouble(value.toString()));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Double asDouble(Object value) {
        if (value == null || value.toString().isBlank()) {
            return null;
        }
        try {
            return Double.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Boolean asBoolean(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        String text = value.toString().trim();
        if (text.isEmpty()) {
            return null;
        }
        return "true".equalsIgnoreCase(text) || "1".equals(text) || "on".equalsIgnoreCase(text);
    }
}
