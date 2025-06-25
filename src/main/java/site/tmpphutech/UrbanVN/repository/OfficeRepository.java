package site.tmpphutech.UrbanVN.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import site.tmpphutech.UrbanVN.model.Office;

import java.util.Optional;

@Repository
public interface OfficeRepository extends JpaRepository<Office, Long> {
    Optional<Office> findByName(String name);
    boolean existsByName(String name);
}

