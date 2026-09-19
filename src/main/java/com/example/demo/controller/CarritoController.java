package com.example.demo.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.CarritoItem;
import com.example.demo.model.Producto;
import com.example.demo.model.Usuario;
import com.example.demo.repository.CarritoItemRepository;
import com.example.demo.repository.ProductoRepository;
import com.example.demo.repository.UsuarioRepository;

@RestController
@RequestMapping("/api/carrito")
@CrossOrigin(origins = "*")
public class CarritoController {

    @Autowired
    private CarritoItemRepository carritoItemRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Obtener el carrito completo del cliente con cálculo de subtotal y total
     * GET /api/carrito/{clienteId}
     */
    @GetMapping("/{clienteId}")
    public ResponseEntity<?> obtenerCarrito(@PathVariable Long clienteId) {
        List<CarritoItem> items = carritoItemRepository.findByClienteId(clienteId);

        double total = 0.0;
        int totalArticulos = 0;
        boolean tieneProductosConReceta = false;

        for (CarritoItem item : items) {
            total += item.getSubtotal();
            totalArticulos += item.getCantidad();
            if (item.getProducto() != null && Boolean.TRUE.equals(item.getProducto().getRequierePrescripcion())) {
                tieneProductosConReceta = true;
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("items", items);
        response.put("total", total);
        response.put("totalArticulos", totalArticulos);
        response.put("tieneProductosConReceta", tieneProductosConReceta);

        return ResponseEntity.ok(response);
    }

    /**
     * Agregar un producto al carrito
     * POST /api/carrito
     */
    @PostMapping
    public ResponseEntity<?> agregarAlCarrito(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();

        try {
            Long clienteId = Long.valueOf(payload.get("clienteId").toString());
            Long productoId = Long.valueOf(payload.get("productoId").toString());
            Integer cantidad = payload.get("cantidad") != null ? Integer.valueOf(payload.get("cantidad").toString()) : 1;

            Optional<Usuario> clienteOpt = usuarioRepository.findById(clienteId);
            Optional<Producto> prodOpt = productoRepository.findById(productoId);

            if (clienteOpt.isEmpty() || prodOpt.isEmpty()) {
                response.put("exito", false);
                response.put("mensaje", "Cliente o Producto no encontrado.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            Producto producto = prodOpt.get();
            if (!Boolean.TRUE.equals(producto.getActivo())) {
                response.put("exito", false);
                response.put("mensaje", "Este producto no está disponible para la venta.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            if (cantidad == null || cantidad <= 0) {
                response.put("exito", false);
                response.put("mensaje", "La cantidad debe ser mayor a cero.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            Optional<CarritoItem> existente = carritoItemRepository.findByClienteIdAndProductoId(clienteId, productoId);
            int cantidadFinal = existente.isPresent() ? existente.get().getCantidad() + cantidad : cantidad;

            if (producto.getStock() < cantidadFinal) {
                response.put("exito", false);
                response.put("mensaje", "Stock insuficiente. Disponible: " + producto.getStock());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            CarritoItem item;
            if (existente.isPresent()) {
                item = existente.get();
                item.setCantidad(cantidadFinal);
            } else {
                item = new CarritoItem(clienteOpt.get(), producto, cantidad);
            }

            if (Boolean.TRUE.equals(producto.getRequierePrescripcion())) {
                response.put("requierePrescripcion", true);
                response.put("avisoReceta", "Este producto requiere receta médica. Deberás declarar una fórmula vigente al pagar.");
            }

            carritoItemRepository.save(item);

            response.put("exito", true);
            response.put("mensaje", "Producto añadido al carrito.");
            response.put("item", item);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("exito", false);
            response.put("mensaje", "Error al procesar carrito: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Actualizar cantidad de un ítem
     * PUT /api/carrito/{itemId}
     */
    @PutMapping("/{itemId}")
    public ResponseEntity<?> actualizarCantidad(@PathVariable Long itemId, @RequestBody Map<String, Integer> payload) {
        Map<String, Object> response = new HashMap<>();
        Optional<CarritoItem> opt = carritoItemRepository.findById(itemId);
        if (opt.isEmpty()) {
            response.put("exito", false);
            response.put("mensaje", "Item no encontrado.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        Integer nuevaCantidad = payload.get("cantidad");
        if (nuevaCantidad == null || nuevaCantidad <= 0) {
            carritoItemRepository.deleteById(itemId);
            response.put("exito", true);
            response.put("mensaje", "Item removido del carrito.");
            return ResponseEntity.ok(response);
        }

        CarritoItem item = opt.get();
        if (item.getProducto().getStock() < nuevaCantidad) {
            response.put("exito", false);
            response.put("mensaje", "Stock insuficiente. Máximo disponible: " + item.getProducto().getStock());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        item.setCantidad(nuevaCantidad);
        carritoItemRepository.save(item);

        response.put("exito", true);
        response.put("mensaje", "Cantidad actualizada.");
        response.put("item", item);
        return ResponseEntity.ok(response);
    }

    /**
     * Eliminar ítem del carrito
     * DELETE /api/carrito/{itemId}
     */
    @DeleteMapping("/{itemId}")
    public ResponseEntity<?> eliminarItem(@PathVariable Long itemId) {
        if (!carritoItemRepository.existsById(itemId)) {
            return ResponseEntity.notFound().build();
        }
        carritoItemRepository.deleteById(itemId);
        Map<String, Object> r = new HashMap<>();
        r.put("exito", true);
        r.put("mensaje", "Producto eliminado del carrito.");
        return ResponseEntity.ok(r);
    }

    /**
     * Vaciar carrito de un cliente
     * DELETE /api/carrito/cliente/{clienteId}
     */
    @DeleteMapping("/cliente/{clienteId}")
    @Transactional
    public ResponseEntity<?> vaciarCarrito(@PathVariable Long clienteId) {
        carritoItemRepository.deleteByClienteId(clienteId);
        Map<String, Object> r = new HashMap<>();
        r.put("exito", true);
        r.put("mensaje", "Carrito vaciado exitosamente.");
        return ResponseEntity.ok(r);
    }
}
