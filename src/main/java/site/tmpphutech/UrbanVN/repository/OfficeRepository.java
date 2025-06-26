package site.tmpphutech.UrbanVN.repository;

import site.tmpphutech.UrbanVN.model.Office;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface OfficeRepository extends JpaRepository<Office, Long> {
    Optional<Office> findByName(String name);
    boolean existsByName(String name);
    List<Office> findByIsActive(boolean isActive);
}

