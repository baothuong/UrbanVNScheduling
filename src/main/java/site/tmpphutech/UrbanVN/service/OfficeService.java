package site.tmpphutech.UrbanVN.service;

import site.tmpphutech.UrbanVN.dto.OfficeCreateDTO;
import site.tmpphutech.UrbanVN.dto.OfficeDTO;
import site.tmpphutech.UrbanVN.dto.OfficeUpdateDTO;
import site.tmpphutech.UrbanVN.exception.DuplicateResourceException;
import site.tmpphutech.UrbanVN.exception.ResourceNotFoundException;
import site.tmpphutech.UrbanVN.model.Employee;
import site.tmpphutech.UrbanVN.model.Office;
import site.tmpphutech.UrbanVN.repository.EmployeeRepository;
import site.tmpphutech.UrbanVN.repository.OfficeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OfficeService {

    private final OfficeRepository officeRepository;
    private final EmployeeRepository employeeRepository;


    public List<OfficeDTO> getAllOffices() {
        List<Office> offices = officeRepository.findAll();
        return offices.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public OfficeDTO getOfficeById(Long id) {
        Office office = officeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ID: " + id + " のオフィスが見つかりません。")); // "Không tìm thấy văn phòng với ID:"
        return convertToDTO(office);
    }

    public OfficeDTO createOffice(OfficeCreateDTO createDTO) {
        if (officeRepository.existsByName(createDTO.getName())) {
            throw new DuplicateResourceException("オフィス名が既に存在します: " + createDTO.getName()); // "Tên văn phòng đã tồn tại:"
        }

        Office office = new Office();
        office.setName(createDTO.getName());
        office.setAddress(createDTO.getAddress());


        Office savedOffice = officeRepository.save(office);
        return convertToDTO(savedOffice);
    }

    public OfficeDTO updateOffice(Long id, OfficeUpdateDTO updateDTO) {
        Office office = officeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ID: " + id + " のオフィスが見つかりません。")); // "Không tìm thấy văn phòng với ID:"

        // 名前が変更された場合の重複チェック
        // Kiểm tra tên trùng (nếu thay đổi)
        if (!office.getName().equals(updateDTO.getName()) &&
                officeRepository.existsByName(updateDTO.getName())) {
            throw new DuplicateResourceException("オフィス名が既に存在します: " + updateDTO.getName()); // "Tên văn phòng đã tồn tại:"
        }

        office.setName(updateDTO.getName());
        office.setAddress(updateDTO.getAddress());


        Office savedOffice = officeRepository.save(office);
        return convertToDTO(savedOffice);
    }

    public void deleteOffice(Long id) throws ResourceNotFoundException {
        Office office = officeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ID: " + id + " のオフィスが見つかりません。")); // "Không tìm thấy văn phòng với ID:"

        // === 最も重要なチェックセクション ===
        // === ĐOẠN KIỂM TRA QUAN TRỌNG NHẤT ===
        // このオフィスに従業員がいるかを確認する必要がある。
        // Nó phải kiểm tra xem có nhân viên nào trong văn phòng này không.
        List<Employee> employeesInOffice = employeeRepository.findByOfficeId(id);

        // 従業員リストが空でない場合 (!employeesInOffice.isEmpty())、
        // エラーをスローして直ちに処理を停止する必要がある。
        // Nếu danh sách nhân viên KHÔNG RỖNG (!employeesInOffice.isEmpty())
        // thì phải ném ra lỗi và DỪNG LẠI NGAY LẬP TỨC.
        if (!employeesInOffice.isEmpty()) {
            throw new DuplicateResourceException(
                    "オフィスを停止できません。このオフィスにはまだ " + // "Không thể ngừng hoạt động văn phòng. Vẫn còn "
                            employeesInOffice.size() +
                            " 人の従業員がいます。先にすべての従業員を他のオフィスに移動してください。" // " nhân viên trong văn phòng này. Vui lòng chuyển hết nhân viên sang văn phòng khác trước."
            );
        }
        // ===================================
        // ===================================

        // 上記の 'if' ブロックが実行されない場合のみ（つまり、従業員がいない場合のみ）、
        // このソフト削除ロジックが実行される。
        // Chỉ khi nào đoạn 'if' ở trên không được thực thi (tức là không còn nhân viên)
        // thì logic xóa mềm này mới được phép chạy.
        office.setActive(false);
        officeRepository.save(office);
    }
    public List<OfficeDTO> getAllActiveOffices() {
        List<Office> activeOffices = officeRepository.findByIsActive(true);
        return activeOffices.stream().map(this::convertToDTO).collect(Collectors.toList());
    }
    private OfficeDTO convertToDTO(Office office) {
        OfficeDTO dto = new OfficeDTO();
        dto.setId(office.getId());
        dto.setName(office.getName());
        dto.setAddress(office.getAddress());
        dto.setActive(office.isActive());
        dto.setEmployeeCount(office.getEmployees() != null ? office.getEmployees().size() : 0);
        return dto;
    }
}