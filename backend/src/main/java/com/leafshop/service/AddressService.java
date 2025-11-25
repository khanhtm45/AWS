package com.leafshop.service;

import com.leafshop.dto.address.AddressRequest;
import com.leafshop.model.dynamodb.UserTable;
import com.leafshop.repository.UserTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final UserTableRepository userTableRepository;

    public UserTable addAddress(String username, AddressRequest req) {
        var accountOpt = userTableRepository.findAccountByUsername(username);
        if (accountOpt.isEmpty()) throw new RuntimeException("User not found");
        String pk = accountOpt.get().getPk();
        String addressId = UUID.randomUUID().toString();
        UserTable address = UserTable.builder()
            .pk(pk)
            .sk("ADDRESS#" + addressId)
            .itemType("ADDRESS")
            .addressLine1(req.getAddressLine1())
            .addressLine2(req.getAddressLine2())
            .city(req.getCity())
            .province(req.getProvince())
            .postalCode(req.getPostalCode())
            .country(req.getCountry())
            .isDefault(req.getIsDefault() != null ? req.getIsDefault() : false)
            .createdAt(System.currentTimeMillis())
            .updatedAt(System.currentTimeMillis())
            .build();

        if (address.getIsDefault()) {
            // unset other defaults
            List<UserTable> others = userTableRepository.findByPkAndSkStartingWith(pk, "ADDRESS#");
            for (UserTable other : others) {
                if (Boolean.TRUE.equals(other.getIsDefault())) {
                    other.setIsDefault(false);
                    userTableRepository.save(other);
                }
            }
        }

        userTableRepository.save(address);
        return address;
    }

    public List<UserTable> listAddresses(String username) {
        var accountOpt = userTableRepository.findAccountByUsername(username);
        if (accountOpt.isEmpty()) return List.of();
        String pk = accountOpt.get().getPk();
        return userTableRepository.findByPkAndSkStartingWith(pk, "ADDRESS#");
    }

    public void deleteAddress(String username, String addressId) {
        var accountOpt = userTableRepository.findAccountByUsername(username);
        if (accountOpt.isEmpty()) throw new RuntimeException("User not found");
        String pk = accountOpt.get().getPk();
        String sk = "ADDRESS#" + addressId;
        var tokenOpt = userTableRepository.findTokenByPkAndSk(pk, sk); // reuse method to get item by pk/sk
        if (tokenOpt.isEmpty()) throw new RuntimeException("Address not found");
        userTableRepository.save(UserTable.builder().pk(pk).sk(sk).itemType("DELETED").build());
    }

    public void setDefault(String username, String addressId) {
        var accountOpt = userTableRepository.findAccountByUsername(username);
        if (accountOpt.isEmpty()) throw new RuntimeException("User not found");
        String pk = accountOpt.get().getPk();
        String sk = "ADDRESS#" + addressId;
        var addrOpt = userTableRepository.findTokenByPkAndSk(pk, sk);
        if (addrOpt.isEmpty()) throw new RuntimeException("Address not found");
        List<UserTable> others = userTableRepository.findByPkAndSkStartingWith(pk, "ADDRESS#");
        for (UserTable other : others) {
            if (Boolean.TRUE.equals(other.getIsDefault())) {
                other.setIsDefault(false);
                userTableRepository.save(other);
            }
        }
        UserTable addr = addrOpt.get();
        addr.setIsDefault(true);
        userTableRepository.save(addr);
    }
}
