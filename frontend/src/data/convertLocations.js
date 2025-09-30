  const fs = require('fs');
const path = require('path');

// Đọc file JSON hiện tại
const currentData = require('./vietnamLocations.json');

// Chuyển đổi dữ liệu sang cấu trúc mới
const newData = {
  provinces: Object.entries(currentData).map(([code, province]) => {
    // Chuyển đổi quận/huyện
    const districts = Object.entries(province['quan-huyen'] || {}).map(([districtCode, district]) => {
      // Chuyển đổi xã/phường
      const communes = Object.entries(district['xa-phuong'] || {}).map(([communeCode, commune]) => ({
        code: communeCode,
        name: commune.name
      }));

      return {
        code: districtCode,
        name: district.name,
        type: district.type,
        communes: communes
      };
    });

    return {
      code: province.code,
      name: province.name,
      type: province.type,
      districts: districts
    };
  })
};

// Ghi ra file mới
fs.writeFileSync(
  path.join(__dirname, 'vietnamLocations_new.json'),
  JSON.stringify(newData, null, 2)
);

console.log('Chuyển đổi dữ liệu thành công!'); 