// src/pages/About/AboutPage.tsx
import { ShieldCheck, Star, Truck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-dark-900 text-white py-16">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black mb-3">Về Chúng Tôi</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Công ty TNHH Vật Liệu Xây Dựng và Trang Trí Nội Thất Tiến Phát
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="py-14">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-600 font-semibold text-sm mb-2">Câu chuyện của chúng tôi</p>
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              Hơn 10 năm đồng hành cùng công trình Việt
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Thành lập năm 2013, Tiến Phát bắt đầu từ một cửa hàng nhỏ tại Quận 7, TP.HCM với mong muốn mang đến những vật liệu xây dựng chất lượng cao với giá cả hợp lý nhất cho người dân thành phố.
              </p>
              <p>
                Qua hơn 10 năm phát triển, chúng tôi đã trở thành một trong những đơn vị cung cấp vật liệu xây dựng và trang trí nội thất uy tín tại TP.HCM, với hơn 5.000 khách hàng tin tưởng và hàng trăm công trình lớn nhỏ.
              </p>
              <p>
                Tiến Phát luôn đặt chất lượng sản phẩm và sự hài lòng của khách hàng lên hàng đầu. Chúng tôi hợp tác trực tiếp với các nhà máy, thương hiệu hàng đầu trong và ngoài nước để đảm bảo nguồn hàng chính hãng, giá cạnh tranh.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '10+', label: 'Năm kinh nghiệm', bg: 'bg-brand-600' },
              { value: '5.000+', label: 'Khách hàng', bg: 'bg-dark-800' },
              { value: '200+', label: 'Sản phẩm', bg: 'bg-dark-800' },
              { value: '98%', label: 'Hài lòng', bg: 'bg-brand-600' },
            ].map(({ value, label, bg }) => (
              <div key={label} className={`${bg} text-white rounded-2xl p-6 flex flex-col items-center justify-center text-center aspect-square`}>
                <p className="text-3xl font-black">{value}</p>
                <p className="text-sm opacity-80 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-14 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Giá trị cốt lõi</h2>
            <p className="text-gray-500">Những cam kết chúng tôi giữ vững suốt hơn 10 năm qua</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: 'Chính hãng 100%', desc: 'Tất cả sản phẩm đều có chứng nhận xuất xứ, hóa đơn VAT đầy đủ.' },
              { icon: Star, title: 'Chất lượng cao', desc: 'Chỉ phân phối những sản phẩm đạt tiêu chuẩn chất lượng khắt khe nhất.' },
              { icon: Truck, title: 'Giao hàng tận nơi', desc: 'Đội xe chuyên dụng, giao hàng đúng hẹn, hỗ trợ bốc xếp miễn phí.' },
              { icon: Users, title: 'Tư vấn chuyên nghiệp', desc: 'Đội kỹ thuật giàu kinh nghiệm, tư vấn phù hợp với từng công trình.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={24} className="text-brand-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-brand-600 text-white text-center">
        <div className="container mx-auto">
          <h2 className="text-2xl font-black mb-3">Sẵn sàng bắt đầu dự án của bạn?</h2>
          <p className="text-white/80 mb-7 max-w-md mx-auto">
            Liên hệ ngay để được tư vấn miễn phí và nhận báo giá tốt nhất.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="tel:0909123456" className="bg-white text-brand-600 font-bold px-7 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              📞 0909 123 456
            </a>
            <Link to="/lien-he" className="border border-white/60 text-white font-semibold px-7 py-3 rounded-lg hover:bg-white/10 transition-colors">
              Gửi yêu cầu
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
