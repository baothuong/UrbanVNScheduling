package site.tmpphutech.UrbanVN.controller;

import site.tmpphutech.UrbanVN.dto.OfficeCreateDTO;
import site.tmpphutech.UrbanVN.dto.OfficeDTO;
import site.tmpphutech.UrbanVN.dto.OfficeUpdateDTO;
import site.tmpphutech.UrbanVN.service.OfficeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/offices")
@RequiredArgsConstructor
public class OfficeController {

    private final OfficeService officeService;

    @GetMapping
    public ResponseEntity<List<OfficeDTO>> getAllOffices() {
        List<OfficeDTO> offices = officeService.getAllOffices();
        return ResponseEntity.ok(offices);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OfficeDTO> getOfficeById(@PathVariable Long id) {
        OfficeDTO office = officeService.getOfficeById(id);
        return ResponseEntity.ok(office);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<OfficeDTO> createOffice(@Valid @RequestBody OfficeCreateDTO createDTO) {
        OfficeDTO office = officeService.createOffice(createDTO);
        return new ResponseEntity<>(office, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<OfficeDTO> updateOffice(@PathVariable Long id,
                                                  @Valid @RequestBody OfficeUpdateDTO updateDTO) {
        OfficeDTO office = officeService.updateOffice(id, updateDTO);
        return ResponseEntity.ok(office);
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> deleteOffice(@PathVariable Long id) {
        officeService.deleteOffice(id);
        return ResponseEntity.noContent().build();
    }
}

