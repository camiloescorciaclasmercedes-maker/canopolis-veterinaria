package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.CarritoItem;
import com.example.demo.model.DetallePedido;
import com.example.demo.model.Pedido;
import com.example.demo.model.Producto;
import com.example.demo.model.Usuario;
import com.example.demo.repository.CarritoItemRepository;
import com.example.demo.repository.DetallePedidoRepository;
import com.example.demo.repository.PedidoRepository;
import com.example.demo.repository.ProductoRepository;
import com.example.demo.repository.UsuarioRepository;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(origins = "*")
public class PedidoController {

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private DetallePedidoRepository detallePedidoRepository;

    @Autowired
    private CarritoItemRepository carritoItemRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Procesar la compra (Checkout) desde el carrito del cliente
     * POST /api/pedidos/checkout
     */
    @PostMapping("/checkout")
    @Transactional
    public ResponseEntity<?> procesarCheckout(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();

        try {
            Long clienteId = Long.valueOf(payload.get("clienteId").toString());
            String direccion = payload.get("direccion") != null ? payload.get("direccion").toString() : "Entrega en sede central";
            String telefono = payload.get("telefono") != null ? payload.get("telefono").toString() : "";
            String metodoPago = payload.get("metodoPago") != null ? payload.get("metodoPago").toString() : "Tarjeta / Contra entrega";
            boolean declaracionFormula = parseBooleanFlag(payload.get("declaracionFormulaVigente"));

            Optional<Usuario> clienteOpt = usuarioRepository.findById(clienteId);
            if (clienteOpt.isEmpty()) {
                response.put("exito", false);
                response.put("mensaje", "Cliente no encontrado.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            List<CarritoItem> items = carritoItemRepository.findByClienteId(clienteId);
            if (items.isEmpty()) {
                response.put("exito", false);
                response.put("mensaje", "El carrito de compras está vacío.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // 1. Validar stock y receta médica (declaración de fórmula vigente)
            double total = 0.0;
            boolean tieneProductosConReceta = false;
            StringBuilder productosReceta = new StringBuilder();
            for (CarritoItem item : items) {
                Producto prod = item.getProducto();
                if (prod.getStock() < item.getCantidad()) {
                    response.put("exito", false);
                    response.put("mensaje", "Stock insuficiente para: " + prod.getNombre() + " (Disponible: " + prod.getStock() + ").");
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
                }
                if (Boolean.TRUE.equals(prod.getRequierePrescripcion())) {
                    tieneProductosConReceta = true;
                    if (productosReceta.length() > 0) {
                        productosReceta.append(", ");
                    }
                    productosReceta.append(prod.getNombre());
                }
                total += item.getSubtotal();
            }

            if (tieneProductosConReceta && !declaracionFormula) {
                response.put("exito", false);
                response.put("requiereDeclaracionFormula", true);
                response.put("mensaje", "No se puede procesar la compra. Debes marcar la Declaración de fórmula médica vigente para: " + productosReceta + ".");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // 2. Crear y guardar el Pedido
            Pedido pedido = new Pedido();
            pedido.setCliente(clienteOpt.get());
            pedido.setFechaPedido(LocalDateTime.now());
            pedido.setTotal(total);
            pedido.setEstado("PAGADO");
            pedido.setDireccionEntrega(direccion);
            pedido.setTelefonoContacto(telefono);
            pedido.setMetodoPago(metodoPago);
            pedido.setDeclaracionFormulaVigente(tieneProductosConReceta && declaracionFormula);

            Pedido pedidoGuardado = pedidoRepository.save(pedido);

            // 3. Crear detalles del pedido y descontar stock del producto
            for (CarritoItem item : items) {
                Producto prod = item.getProducto();
                prod.setStock(prod.getStock() - item.getCantidad());
                productoRepository.save(prod);

                DetallePedido detalle = new DetallePedido(pedidoGuardado, prod, item.getCantidad(), prod.getPrecio());
                detallePedidoRepository.save(detalle);
            }

            // 4. Vaciar el carrito del cliente en BD
            carritoItemRepository.deleteByClienteId(clienteId);

            List<DetallePedido> detalles = detallePedidoRepository.findByPedidoId(pedidoGuardado.getId());

            response.put("exito", true);
            response.put("mensaje", "¡Pedido #" + pedidoGuardado.getId() + " procesado exitosamente!");
            response.put("pedido", pedidoGuardado);
            response.put("detalles", detalles);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            response.put("exito", false);
            response.put("mensaje", "Error al procesar el pedido: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Listar pedidos de un cliente específico
     * GET /api/pedidos/cliente/{clienteId}
     */
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Pedido>> listarPedidosPorCliente(@PathVariable Long clienteId) {
        return ResponseEntity.ok(pedidoRepository.findByClienteIdOrderByFechaPedidoDesc(clienteId));
    }

    /**
     * Obtener detalles de un pedido
     * GET /api/pedidos/{pedidoId}/detalles
     */
    @GetMapping("/{pedidoId}/detalles")
    public ResponseEntity<List<DetallePedido>> obtenerDetallesPedido(@PathVariable Long pedidoId) {
        return ResponseEntity.ok(detallePedidoRepository.findByPedidoId(pedidoId));
    }

    /**
     * Listar todos los pedidos (Panel Administrador)
     * GET /api/pedidos
     */
    @GetMapping
    public ResponseEntity<List<Pedido>> listarTodosLosPedidos() {
        return ResponseEntity.ok(pedidoRepository.findAllByOrderByFechaPedidoDesc());
    }

    /**
     * Actualizar estado del pedido (PAGADO, ENVIADO, ENTREGADO, etc.)
     * PUT /api/pedidos/{id}/estado
     */
    @PutMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<Pedido> opt = pedidoRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Pedido pedido = opt.get();
        String estado = payload.get("estado");
        if (estado != null) {
            pedido.setEstado(estado.toUpperCase());
            pedidoRepository.save(pedido);
        }

        Map<String, Object> r = new HashMap<>();
        r.put("exito", true);
        r.put("mensaje", "Estado del pedido actualizado a: " + pedido.getEstado());
        r.put("pedido", pedido);
        return ResponseEntity.ok(r);
    }

    private boolean parseBooleanFlag(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        String text = value.toString().trim();
        return "true".equalsIgnoreCase(text) || "1".equals(text) || "on".equalsIgnoreCase(text);
    }
}
