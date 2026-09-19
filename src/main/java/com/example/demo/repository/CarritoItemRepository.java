package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.CarritoItem;

@Repository
public interface CarritoItemRepository extends JpaRepository<CarritoItem, Long> {

    List<CarritoItem> findByClienteId(Long clienteId);

    Optional<CarritoItem> findByClienteIdAndProductoId(Long clienteId, Long productoId);

    void deleteByClienteId(Long clienteId);
}
