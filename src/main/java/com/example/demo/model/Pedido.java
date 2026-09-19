package com.example.demo.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @Column(name = "fecha_pedido", nullable = false)
    private LocalDateTime fechaPedido;

    @Column(nullable = false)
    private Double total;

    @Column(nullable = false, length = 30)
    private String estado = "PAGADO"; // PENDIENTE, PAGADO, ENVIADO, ENTREGADO, CANCELADO

    @Column(name = "direccion_entrega", length = 250)
    private String direccionEntrega;

    @Column(name = "telefono_contacto", length = 30)
    private String telefonoContacto;

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago = "Tarjeta / Contra entrega";

    @Column(name = "declaracion_formula_vigente", nullable = false, columnDefinition = "tinyint(1) not null default 0")
    private Boolean declaracionFormulaVigente = false;

    @JsonIgnore
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DetallePedido> detalles = new ArrayList<>();

    // Constructor vacío (requerido por JPA)
    public Pedido() {
        this.fechaPedido = LocalDateTime.now();
    }

    public Pedido(Usuario cliente, Double total, String direccionEntrega, String telefonoContacto, String metodoPago) {
        this.cliente = cliente;
        this.fechaPedido = LocalDateTime.now();
        this.total = total;
        this.estado = "PAGADO";
        this.direccionEntrega = direccionEntrega;
        this.telefonoContacto = telefonoContacto;
        this.metodoPago = metodoPago;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getCliente() {
        return cliente;
    }

    public void setCliente(Usuario cliente) {
        this.cliente = cliente;
    }

    public LocalDateTime getFechaPedido() {
        return fechaPedido;
    }

    public void setFechaPedido(LocalDateTime fechaPedido) {
        this.fechaPedido = fechaPedido;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getDireccionEntrega() {
        return direccionEntrega;
    }

    public void setDireccionEntrega(String direccionEntrega) {
        this.direccionEntrega = direccionEntrega;
    }

    public String getTelefonoContacto() {
        return telefonoContacto;
    }

    public void setTelefonoContacto(String telefonoContacto) {
        this.telefonoContacto = telefonoContacto;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public Boolean getDeclaracionFormulaVigente() {
        return declaracionFormulaVigente;
    }

    public void setDeclaracionFormulaVigente(Boolean declaracionFormulaVigente) {
        this.declaracionFormulaVigente = declaracionFormulaVigente != null && declaracionFormulaVigente;
    }

    public List<DetallePedido> getDetalles() {
        return detalles;
    }

    public void setDetalles(List<DetallePedido> detalles) {
        this.detalles = detalles;
    }
}
