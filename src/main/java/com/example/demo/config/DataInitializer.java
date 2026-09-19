package com.example.demo.config;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.demo.model.Cita;
import com.example.demo.model.Mascota;
import com.example.demo.model.Servicio;
import com.example.demo.model.Usuario;
import com.example.demo.repository.CitaRepository;
import com.example.demo.repository.MascotaRepository;
import com.example.demo.repository.ServicioRepository;
import com.example.demo.repository.UsuarioRepository;

import com.example.demo.model.Producto;
import com.example.demo.repository.ProductoRepository;
import com.example.demo.model.Consulta;
import com.example.demo.model.HistoriaClinica;
import com.example.demo.repository.ConsultaRepository;
import com.example.demo.repository.HistoriaClinicaRepository;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UsuarioRepository usuarioRepository, 
                                      ServicioRepository servicioRepository,
                                      MascotaRepository mascotaRepository,
                                      CitaRepository citaRepository,
                                      HistoriaClinicaRepository historiaClinicaRepository,
                                      ConsultaRepository consultaRepository,
                                      ProductoRepository productoRepository) {
        return args -> {
            // 1. Inicializar Catálogo de Servicios si está vacío
            if (servicioRepository.count() == 0) {
                servicioRepository.saveAll(Arrays.asList(
                    new Servicio("Consulta General", "Revisiones completas de salud, diagnóstico preciso y seguimiento personalizado para tu mascota.", 45000.0, 30, "Consulta", "🩺"),
                    new Servicio("Diagnóstico por Imagen", "Ecografías, radiografías digitales y tomografías para un diagnóstico temprano y preciso.", 95000.0, 45, "Diagnóstico", "🔬"),
                    new Servicio("Vacunación y Desparasitación", "Planes de vacunación completos y personalizados según la especie, raza y estilo de vida.", 35000.0, 20, "Prevención", "💉"),
                    new Servicio("Cirugía Especializada", "Procedimientos quirúrgicos de alta complejidad con equipamiento moderno y anestesia segura.", 250000.0, 90, "Cirugía", "🏥"),
                    new Servicio("Atención de Urgencia", "Atención médica prioritaria e inmediata para situaciones críticas las 24 horas.", 80000.0, 60, "Urgencia", "🚨"),
                    new Servicio("Estética y Spa", "Baños medicados, cortes de pelo según raza, limpieza dental y tratamientos de bienestar integral.", 40000.0, 60, "Estética", "✂️")
                ));
                System.out.println(">> [DataInitializer] Catálogo institucional de 6 servicios Canopolis inicializado con éxito en MySQL.");
            }

            // 2. Inicializar Usuarios Base con Roles Estándar si no existen
            if (usuarioRepository.findByEmail("admin@canopolis.com").isEmpty()) {
                Usuario admin = new Usuario("Administrador Canopolis", "admin@canopolis.com", "admin123", "ADMINISTRADOR", "3001234567", "Sede Central Canopolis");
                usuarioRepository.save(admin);
                System.out.println(">> [DataInitializer] Usuario Administrador creado: admin@canopolis.com / admin123");
            }

            Usuario vet = usuarioRepository.findByEmail("dr.garcia@canopolis.com").orElse(null);
            if (vet == null) {
                vet = new Usuario("Dr. David García", "dr.garcia@canopolis.com", "vet123", "VETERINARIO", "3109876543", "Consultorio 1 - Canopolis");
                vet = usuarioRepository.save(vet);
                System.out.println(">> [DataInitializer] Usuario Veterinario creado: dr.garcia@canopolis.com / vet123");
            }

            Usuario cliente = usuarioRepository.findByEmail("cliente@canopolis.com").orElse(null);
            if (cliente == null) {
                cliente = new Usuario("Camila Restrepo", "cliente@canopolis.com", "cliente123", "CLIENTE", "3205554321", "Calle 10 # 45-20");
                cliente = usuarioRepository.save(cliente);
                System.out.println(">> [DataInitializer] Usuario Cliente de prueba creado: cliente@canopolis.com / cliente123");
            }

            // 3. Mascota de prueba para el cliente si no tiene
            if (cliente != null && mascotaRepository.findByPropietarioId(cliente.getId()).isEmpty()) {
                Mascota toby = new Mascota("Toby", "Perro", "Golden Retriever", "MACHO", LocalDate.of(2022, 5, 10), 28.5, cliente);
                toby = mascotaRepository.save(toby);

                // Apertura de Historia Clínica
                HistoriaClinica hc = new HistoriaClinica(toby, "HC-0001-2026", "Esterilizado en 2023. Sin alergias previas.", "Ninguna");
                hc = historiaClinicaRepository.save(hc);

                // Consulta médica previa registrada
                Consulta consultaAnterior = new Consulta(
                    hc, vet, null,
                    LocalDate.now().minusMonths(1), LocalTime.of(9, 30),
                    "Vacunación anual y desparasitación",
                    "Paciente activo y alerta. Mucosas rosadas. Sin vómitos ni diarrea.",
                    28.0,
                    "Paciente canino clínicamente sano. Esquema de inmunización al día.",
                    "Aplicación de vacuna séxtuple canina y refuerzo antirrábico.",
                    "Simparica Trio 20-40kg (1 comprimido masticable mensual)"
                );
                consultaAnterior.setRecomendaciones("Mantener hidratación adecuada y evitar ejercicio intenso por 24 horas posteriores a la vacuna.");
                consultaRepository.save(consultaAnterior);
                System.out.println(">> [DataInitializer] Historia clínica y consulta médica previa inicializadas para Toby.");

                // Cita asignada de prueba para el Dr. David García
                if (citaRepository.count() == 0) {
                    Cita cita = new Cita(toby, "Consulta General", LocalDate.now().plusDays(1), LocalTime.of(10, 0), "Control médico de rutina y chequeo dermatológico");
                    cita.setVeterinario(vet);
                    cita.setEstado("CONFIRMADA");
                    citaRepository.save(cita);
                    System.out.println(">> [DataInitializer] Cita médica de demostración asignada al Dr. David García para mañana a las 10:00 AM.");
                }
            }

            // 4. Inicializar Catálogo de Productos para la Tienda y Farmacia si está vacío
            if (productoRepository.count() == 0) {
                productoRepository.saveAll(Arrays.asList(
                    new Producto("Alimento Hill's Science Diet Adulto 15kg", "Nutrición clínica balanceada para caninos adultos con antioxidantes y proteínas de alta digestibilidad.", 265000.0, 20, "Alimentos", false, "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&fit=crop"),
                    new Producto("Simparica Trio 20-40kg (3 Tabletas)", "Antiparasitario oral de triple acción mensual: pulgas, garrapatas y parásitos internos.", 115000.0, 35, "Antiparasitarios", false, "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&fit=crop"),
                    new Producto("Amoxicilina + Ácido Clavulánico 250mg", "Antibiótico de amplio espectro para infecciones respiratorias, dérmicas y dentales. Uso controlado.", 48000.0, 15, "Farmacia", true, "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&fit=crop"),
                    new Producto("Meloxicam Gotas 0.5% (15ml)", "Antiinflamatorio no esteroideo y analgésico post-quirúrgico o para osteoartritis.", 32000.0, 25, "Farmacia", true, "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&fit=crop"),
                    new Producto("Shampoo Dermatológico Clorhexidina 3%", "Shampoo antiséptico y fungicida para el tratamiento de piodermas e infecciones cutáneas.", 38000.0, 40, "Higiene", false, "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&fit=crop"),
                    new Producto("Collar Isabelino Protector Talla L", "Cono protector ajustable para recuperación post-operatoria y prevención de lamido.", 24000.0, 30, "Accesorios", false, "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500&fit=crop")
                ));
                System.out.println(">> [DataInitializer] Catálogo inicial de 6 productos de Tienda & Farmacia Canopolis creado en MySQL.");
            }
        };
    }
}
