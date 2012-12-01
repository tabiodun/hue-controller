get "/setup" do
  @username = Digest::SHA1.hexdigest(rand(30 ** 30).to_s)

  haml :setup
end

post "/setup" do
  url = URI("http://#{params[:ip]}/api")

  http = Net::HTTP.new(url.host, url.port)
  res = http.request_post(url.request_uri, {:username => params[:username], :devicetype => params[:devicetype]}.to_json)
  res = JSON.parse(res.body)

  res = res.first
  if res["error"] and res["error"]["type"] == 101
    [400, "waiting"]
  elsif res["error"]
    [400, res["error"]["description"]]
  elsif res["success"]
    $config = {:ip => params[:ip], :apikey => params[:username]}

    unless File.directory?("./config/")
      require "fileutils"
      FileUtils.mkdir("./config/")
    end

    File.open("./config/config.yml", "w+") do |f|
      f.write($config.to_yaml)
    end

    [200, "success"]
  end
end